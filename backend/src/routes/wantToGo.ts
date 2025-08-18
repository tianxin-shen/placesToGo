import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import WantToGo from '../models/WantToGo';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/want-to-go:
 *   get:
 *     summary: Get all want-to-go places for a user
 *     tags: [WantToGo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: User ID (browser-generated for guests, optional if authenticated)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, visited, cancelled]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of want-to-go places
 *       401:
 *         description: Not authenticated (if no user_id provided)
 */
router.get('/', 
  optionalAuth, // Try to authenticate, but don't require it
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id, status } = req.query;
      
      // Determine user ID: authenticated user takes precedence
      let targetUserId: string;
      
      if (req.user) {
        // Authenticated user
        targetUserId = req.user._id.toString();
      } else if (user_id) {
        // Guest user
        targetUserId = user_id as string;
      } else {
        res.status(401).json({ 
          error: {
            code: 'USER_ID_REQUIRED',
            message: 'User ID is required for guest access or authentication required'
          }
        });
        return;
      }

      const query: any = { user_id: targetUserId };

      if (status) {
        query.status = status;
      }

      const wantToGoPlaces = await WantToGo.find(query)
        .sort({ saved_at: -1 });

      res.json(wantToGoPlaces);
    } catch (error) {
      console.error('Error fetching want-to-go places:', error);
      res.status(500).json({ 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error fetching want-to-go places'
        }
      });
    }
  }
);

/**
 * @swagger
 * /api/want-to-go/groups:
 *   get:
 *     summary: Get want-to-go places grouped by category
 *     tags: [WantToGo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: User ID (browser-generated for guests, optional if authenticated)
 *       - in: query
 *         name: groupBy
 *         required: true
 *         schema:
 *           type: string
 *           enum: [location, type, year]
 *         description: Group by category
 *     responses:
 *       200:
 *         description: Grouped want-to-go places
 *       401:
 *         description: Not authenticated (if no user_id provided)
 */
router.get('/groups',
  optionalAuth,
  query('groupBy').isIn(['location', 'type', 'year']).withMessage('Invalid groupBy parameter'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id, groupBy } = req.query;
      
      // Determine user ID: authenticated user takes precedence
      let targetUserId: string;
      
      if (req.user) {
        // Authenticated user
        targetUserId = req.user._id.toString();
      } else if (user_id) {
        // Guest user
        targetUserId = user_id as string;
      } else {
        res.status(401).json({ 
          error: {
            code: 'USER_ID_REQUIRED',
            message: 'User ID is required for guest access or authentication required'
          }
        });
        return;
      }

      const wantToGoPlaces = await WantToGo.find({ user_id: targetUserId });

      const grouped = wantToGoPlaces.reduce((acc: any, item: any) => {
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
      console.error('Error fetching grouped want-to-go places:', error);
      res.status(500).json({ 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error fetching grouped want-to-go places'
        }
      });
    }
  }
);

/**
 * @swagger
 * /api/want-to-go:
 *   post:
 *     summary: Add a place to want-to-go list
 *     tags: [WantToGo]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - place_id
 *             properties:
 *               place_id:
 *                 type: string
 *                 description: Google Places API place_id
 *               user_id:
 *                 type: string
 *                 description: User ID (optional if authenticated)
 *               location_group:
 *                 type: string
 *               type_group:
 *                 type: string
 *               notes:
 *                 type: string
 *               priority:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               status:
 *                 type: string
 *                 enum: [pending, visited, cancelled]
 *               plannedVisitDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Place added to want-to-go list
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Not authenticated (if no user_id provided)
 */
router.post('/',
  optionalAuth,
  [
    body('place_id').notEmpty().withMessage('Place ID is required'),
    body('priority').optional().isInt({ min: 1, max: 5 }).withMessage('Priority must be between 1 and 5'),
    body('status').optional().isIn(['pending', 'visited', 'cancelled']).withMessage('Invalid status')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { place_id, user_id, location_group, type_group, notes, priority, status, plannedVisitDate } = req.body;
      
      // Determine user ID: authenticated user takes precedence
      let targetUserId: string;
      
      if (req.user) {
        // Authenticated user
        targetUserId = req.user._id.toString();
      } else if (user_id) {
        // Guest user
        targetUserId = user_id;
      } else {
        res.status(401).json({ 
          error: {
            code: 'USER_ID_REQUIRED',
            message: 'User ID is required for guest access or authentication required'
          }
        });
        return;
      }

      // Check if already in want-to-go list
      const existing = await WantToGo.findOne({ place_id, user_id: targetUserId });
      if (existing) {
        res.status(400).json({ 
          error: {
            code: 'DUPLICATE_PLACE',
            message: 'Place already in want-to-go list'
          }
        });
        return;
      }

      const wantToGo = new WantToGo({
        place_id,
        user_id: targetUserId,
        location_group,
        type_group,
        notes,
        priority,
        status: status || 'pending',
        year_group: new Date().getFullYear(),
        plannedVisitDate: plannedVisitDate ? new Date(plannedVisitDate) : undefined
      });

      await wantToGo.save();
      res.status(201).json(wantToGo);
    } catch (error) {
      console.error('Error adding want-to-go place:', error);
      res.status(500).json({ 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error adding want-to-go place'
        }
      });
    }
  }
);

/**
 * @swagger
 * /api/want-to-go/{placeId}:
 *   delete:
 *     summary: Remove a place from want-to-go list
 *     tags: [WantToGo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: placeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: User ID (optional if authenticated)
 *     responses:
 *       200:
 *         description: Place removed from want-to-go list
 *       404:
 *         description: Want-to-go place not found
 *       401:
 *         description: Not authenticated (if no user_id provided)
 */
router.delete('/:placeId',
  optionalAuth,
  param('placeId').notEmpty().withMessage('Place ID is required'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { placeId } = req.params;
      const { user_id } = req.query;
      
      // Determine user ID: authenticated user takes precedence
      let targetUserId: string;
      
      if (req.user) {
        // Authenticated user
        targetUserId = req.user._id.toString();
      } else if (user_id) {
        // Guest user
        targetUserId = user_id as string;
      } else {
        res.status(401).json({ 
          error: {
            code: 'USER_ID_REQUIRED',
            message: 'User ID is required for guest access or authentication required'
          }
        });
        return;
      }

      const result = await WantToGo.findOneAndDelete({ 
        place_id: placeId, 
        user_id: targetUserId 
      });

      if (!result) {
        res.status(404).json({ 
          error: {
            code: 'PLACE_NOT_FOUND',
            message: 'Want-to-go place not found'
          }
        });
        return;
      }

      res.json({ message: 'Place removed from want-to-go list' });
    } catch (error) {
      console.error('Error removing want-to-go place:', error);
      res.status(500).json({ 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error removing want-to-go place'
        }
      });
    }
  }
);

/**
 * @swagger
 * /api/want-to-go/{placeId}:
 *   patch:
 *     summary: Update want-to-go place details
 *     tags: [WantToGo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: placeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: User ID (optional if authenticated)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               location_group:
 *                 type: string
 *               type_group:
 *                 type: string
 *               notes:
 *                 type: string
 *               priority:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               status:
 *                 type: string
 *                 enum: [pending, visited, cancelled]
 *               plannedVisitDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Want-to-go place updated
 *       404:
 *         description: Want-to-go place not found
 *       401:
 *         description: Not authenticated (if no user_id provided)
 */
router.patch('/:placeId',
  optionalAuth,
  [
    param('placeId').notEmpty().withMessage('Place ID is required'),
    body('priority').optional().isInt({ min: 1, max: 5 }).withMessage('Priority must be between 1 and 5'),
    body('status').optional().isIn(['pending', 'visited', 'cancelled']).withMessage('Invalid status')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { placeId } = req.params;
      const { user_id } = req.query;
      const updates = req.body;
      
      // Determine user ID: authenticated user takes precedence
      let targetUserId: string;
      
      if (req.user) {
        // Authenticated user
        targetUserId = req.user._id.toString();
      } else if (user_id) {
        // Guest user
        targetUserId = user_id as string;
      } else {
        res.status(401).json({ 
          error: {
            code: 'USER_ID_REQUIRED',
            message: 'User ID is required for guest access or authentication required'
          }
        });
        return;
      }

      // Handle plannedVisitDate conversion
      if (updates.plannedVisitDate) {
        updates.plannedVisitDate = new Date(updates.plannedVisitDate);
      }

      const wantToGo = await WantToGo.findOneAndUpdate(
        { place_id: placeId, user_id: targetUserId },
        { $set: updates },
        { new: true }
      );

      if (!wantToGo) {
        res.status(404).json({ 
          error: {
            code: 'PLACE_NOT_FOUND',
            message: 'Want-to-go place not found'
          }
        });
        return;
      }

      res.json(wantToGo);
    } catch (error) {
      console.error('Error updating want-to-go place:', error);
      res.status(500).json({ 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error updating want-to-go place'
        }
      });
    }
  }
);

export default router; 