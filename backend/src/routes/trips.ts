import { Router, Request, Response } from 'express';
import { body, param } from 'express-validator';
import crypto from 'crypto';
import Trip from '../models/Trip';
import { authenticate } from '../middleware/auth';

const router = Router();

// All trip routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/trips:
 *   post:
 *     summary: Create a new trip
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - destination
 *               - startDate
 *               - endDate
 *               - travelerCount
 *               - preferences
 *             properties:
 *               destination:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               travelerCount:
 *                 type: integer
 *                 minimum: 1
 *               preferences:
 *                 type: object
 *                 properties:
 *                   pace:
 *                     type: string
 *                     enum: [relaxed, moderate, packed]
 *                   focus:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: [outdoor, food, culture, mix]
 *               keyPlaceIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Trip created
 *       400:
 *         description: Invalid request data
 */
router.post(
  '/',
  [
    body('destination').notEmpty().withMessage('Destination is required'),
    body('startDate').isISO8601().withMessage('Valid startDate is required'),
    body('endDate').isISO8601().withMessage('Valid endDate is required'),
    body('travelerCount').isInt({ min: 1 }).withMessage('travelerCount must be at least 1'),
    body('preferences.pace').isIn(['relaxed', 'moderate', 'packed']).withMessage('Invalid pace'),
    body('preferences.focus').isArray().withMessage('focus must be an array'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { destination, startDate, endDate, travelerCount, preferences, keyPlaceIds } = req.body;

      const trip = new Trip({
        userId: req.user!._id,
        destination,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        travelerCount,
        preferences,
        keyPlaceIds: keyPlaceIds ?? [],
        status: 'draft',
        itinerary: [],
      });

      await trip.save();
      res.status(201).json(trip);
    } catch (error) {
      console.error('Error creating trip:', error);
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error creating trip' } });
    }
  }
);

/**
 * @swagger
 * /api/trips:
 *   get:
 *     summary: List all trips for the authenticated user
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of trips
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const trips = await Trip.find({ userId: req.user!._id }).sort({ createdAt: -1 });
    res.json(trips);
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error fetching trips' } });
  }
});

/**
 * @swagger
 * /api/trips/{id}:
 *   get:
 *     summary: Get a trip by ID
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip detail
 *       404:
 *         description: Trip not found
 */
router.get(
  '/:id',
  param('id').isMongoId().withMessage('Invalid trip ID'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const trip = await Trip.findOne({ _id: req.params.id, userId: req.user!._id });

      if (!trip) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Trip not found' } });
        return;
      }

      res.json(trip);
    } catch (error) {
      console.error('Error fetching trip:', error);
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error fetching trip' } });
    }
  }
);

/**
 * @swagger
 * /api/trips/{id}:
 *   put:
 *     summary: Update a trip
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preferences:
 *                 type: object
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *               itinerary:
 *                 type: array
 *     responses:
 *       200:
 *         description: Trip updated
 *       404:
 *         description: Trip not found
 */
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid trip ID'),
    body('status').optional().isIn(['draft', 'published']).withMessage('Invalid status'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { preferences, status, itinerary } = req.body;
      const updates: Record<string, unknown> = {};

      if (preferences !== undefined) updates.preferences = preferences;
      if (itinerary !== undefined) updates.itinerary = itinerary;

      if (status === 'published') {
        updates.status = 'published';
        updates.shareToken = crypto.randomBytes(16).toString('hex');
      } else if (status !== undefined) {
        updates.status = status;
      }

      const trip = await Trip.findOneAndUpdate(
        { _id: req.params.id, userId: req.user!._id },
        { $set: updates },
        { new: true }
      );

      if (!trip) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Trip not found' } });
        return;
      }

      res.json(trip);
    } catch (error) {
      console.error('Error updating trip:', error);
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error updating trip' } });
    }
  }
);

/**
 * @swagger
 * /api/trips/{id}:
 *   delete:
 *     summary: Delete a trip
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip deleted
 *       404:
 *         description: Trip not found
 */
router.delete(
  '/:id',
  param('id').isMongoId().withMessage('Invalid trip ID'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const trip = await Trip.findOneAndDelete({ _id: req.params.id, userId: req.user!._id });

      if (!trip) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Trip not found' } });
        return;
      }

      res.json({ message: 'Trip deleted' });
    } catch (error) {
      console.error('Error deleting trip:', error);
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error deleting trip' } });
    }
  }
);

export default router;
