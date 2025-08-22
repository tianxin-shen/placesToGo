import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
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
router.post('/:groupId/places', authenticate, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { 
      place_id, 
      notes, 
      location_group, 
      type_group, 
      year_group = new Date().getFullYear(),
      priority = 3,
      plannedVisitDate 
    } = req.body;
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
      if (existingPlace.status !== 'removed') {
        return res.status(400).json({ message: 'Place already in group' });
      }
      // Reactivate if previously removed and update fields
      existingPlace.status = 'pending';
      existingPlace.removed_by = undefined;
      if (notes) existingPlace.notes = notes;
      if (location_group) existingPlace.location_group = location_group;
      if (type_group) existingPlace.type_group = type_group;
      if (year_group) existingPlace.year_group = year_group;
      if (priority) existingPlace.priority = priority;
      if (plannedVisitDate) existingPlace.plannedVisitDate = plannedVisitDate;
      await existingPlace.save();
      return res.json(existingPlace);
    }

    // Add new place
    const groupPlace = await GroupPlace.create({
      group_id: groupId,
      place_id,
      added_by: userId,
      notes,
      location_group,
      type_group,
      year_group,
      priority,
      plannedVisitDate,
      status: 'pending'
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
 *     summary: Get group places grouped by category
 *     tags: [Group Places]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [location, type, year]
 *           default: location
 *         description: Group by category
 */
router.get('/:groupId/places', authenticate, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { groupBy = 'location' } = req.query;
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

    // Get active group places (not removed)
    const groupPlaces = await GroupPlace.find({
      group_id: groupId,
      status: { $ne: 'removed' }
    }).sort({ created_at: -1 });

    // Group the places similar to WantToGo route
    const grouped = groupPlaces.reduce((acc: any, item: any) => {
      let key: string;
      switch (groupBy) {
        case 'location':
          key = item.location_group || 'Uncategorized';
          break;
        case 'type':
          key = item.type_group || 'Uncategorized';
          break;
        case 'year':
          key = item.year_group?.toString() || 'Uncategorized';
          break;
        default:
          key = 'Uncategorized';
      }

      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});

    res.json(grouped);
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
router.delete('/:groupId/places/:placeId', authenticate, async (req: Request, res: Response) => {
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
      status: { $ne: 'removed' }
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
