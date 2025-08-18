import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import Group from '../models/Group';
import GroupMember from '../models/GroupMember';
import GroupPlace from '../models/GroupPlace';

const router = Router();

/**
 * @swagger
 * /api/groups/{groupId}/places:
 *   post:
 *     summary: Add a place to group
 *     tags: [Group Places]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 */
router.post('/:groupId/places', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { place_id, notes } = req.body;
    const userId = req.user?.id;

    // Check membership
    const membership = await GroupMember.findOne({
      group_id: groupId,
      user_id: userId,
      status: 'active'
    });

    if (!membership) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    // Check if place already exists
    const existingPlace = await GroupPlace.findOne({
      group_id: groupId,
      place_id
    });

    if (existingPlace) {
      if (existingPlace.status === 'active') {
        return res.status(400).json({ message: 'Place already in group' });
      }
      // Reactivate if previously removed
      existingPlace.status = 'active';
      existingPlace.removed_by = undefined;
      await existingPlace.save();
      return res.json(existingPlace);
    }

    // Add new place
    const groupPlace = await GroupPlace.create({
      group_id: groupId,
      place_id,
      added_by: userId,
      notes,
      status: 'active'
    });

    res.status(201).json(groupPlace);
  } catch (error) {
    console.error('Error adding place to group:', error);
    res.status(500).json({ message: 'Failed to add place to group' });
  }
});

/**
 * @swagger
 * /api/groups/{groupId}/places:
 *   get:
 *     summary: Get group places
 *     tags: [Group Places]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:groupId/places', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.user?.id;

    // Check membership
    const membership = await GroupMember.findOne({
      group_id: groupId,
      user_id: userId,
      status: 'active'
    });

    if (!membership) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    const places = await GroupPlace.find({
      group_id: groupId,
      status: 'active'
    }).sort({ createdAt: -1 });

    res.json(places);
  } catch (error) {
    console.error('Error fetching group places:', error);
    res.status(500).json({ message: 'Failed to fetch group places' });
  }
});

/**
 * @swagger
 * /api/groups/{groupId}/places/{placeId}:
 *   delete:
 *     summary: Remove a place from group
 *     tags: [Group Places]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: placeId
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:groupId/places/:placeId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { groupId, placeId } = req.params;
    const userId = req.user?.id;

    // Check membership
    const membership = await GroupMember.findOne({
      group_id: groupId,
      user_id: userId,
      status: 'active'
    });

    if (!membership) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    const groupPlace = await GroupPlace.findOne({
      group_id: groupId,
      place_id: placeId,
      status: 'active'
    });

    if (!groupPlace) {
      return res.status(404).json({ message: 'Place not found in group' });
    }

    groupPlace.status = 'removed';
    groupPlace.removed_by = userId;
    await groupPlace.save();

    res.json({ message: 'Place removed from group' });
  } catch (error) {
    console.error('Error removing place from group:', error);
    res.status(500).json({ message: 'Failed to remove place from group' });
  }
});

export default router;
