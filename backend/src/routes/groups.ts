import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import Group from '../models/Group';
import GroupMember from '../models/GroupMember';
import GroupPlace from '../models/GroupPlace';
import { generateShareCode } from '../utils/codeGenerator';

const router = Router();

/**
 * @swagger
 * /api/groups:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const userId = req.user?.id;

    // Generate unique share code
    let shareCode;
    let isUnique = false;
    while (!isUnique) {
      shareCode = generateShareCode();
      const existingGroup = await Group.findOne({ shareCode });
      if (!existingGroup) {
        isUnique = true;
      }
    }

    // Create group
    const group = await Group.create({
      name,
      description,
      shareCode,
      status: 'active'
    });

    // Add creator as owner
    await GroupMember.create({
      group_id: group._id,
      user_id: userId,
      role: 'owner',
      status: 'active'
    });

    res.status(201).json(group);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Failed to create group' });
  }
});

/**
 * @swagger
 * /api/groups:
 *   get:
 *     summary: Get user's groups
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    // Find all active memberships
    const memberships = await GroupMember.find({
      user_id: userId,
      status: 'active'
    }).populate('group_id');

    const groups = memberships.map(m => m.group_id);
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Failed to fetch groups' });
  }
});

/**
 * @swagger
 * /api/groups/{id}:
 *   get:
 *     summary: Get group details
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check membership
    const membership = await GroupMember.findOne({
      group_id: id,
      user_id: userId,
      status: 'active'
    });

    if (!membership) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ message: 'Failed to fetch group' });
  }
});

/**
 * @swagger
 * /api/groups/join:
 *   post:
 *     summary: Join a group using share code
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shareCode
 *             properties:
 *               shareCode:
 *                 type: string
 */
router.post('/join', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { shareCode } = req.body;
    const userId = req.user?.id;

    const group = await Group.findOne({ shareCode, status: 'active' });
    if (!group) {
      return res.status(404).json({ message: 'Invalid share code or group not found' });
    }

    // Check if already a member
    const existingMembership = await GroupMember.findOne({
      group_id: group._id,
      user_id: userId
    });

    if (existingMembership) {
      if (existingMembership.status === 'active') {
        return res.status(400).json({ message: 'Already a member of this group' });
      }
      // Reactivate membership if previously left
      existingMembership.status = 'active';
      await existingMembership.save();
    } else {
      // Create new membership
      await GroupMember.create({
        group_id: group._id,
        user_id: userId,
        role: 'editor',
        status: 'active'
      });
    }

    res.json({ message: 'Successfully joined group', group });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ message: 'Failed to join group' });
  }
});

/**
 * @swagger
 * /api/groups/{id}/leave:
 *   delete:
 *     summary: Leave a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:id/leave', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const membership = await GroupMember.findOne({
      group_id: id,
      user_id: userId,
      status: 'active'
    });

    if (!membership) {
      return res.status(404).json({ message: 'Not a member of this group' });
    }

    if (membership.role === 'owner') {
      return res.status(400).json({ message: 'Owner cannot leave group without transferring ownership' });
    }

    membership.status = 'left';
    await membership.save();

    res.json({ message: 'Successfully left group' });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({ message: 'Failed to leave group' });
  }
});

export default router;
