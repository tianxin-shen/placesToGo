import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth';
import Trip, { ITrip } from '../models/Trip';
import TripDay from '../models/TripDay';
import TripPlace from '../models/TripPlace';
import TripActivity from '../models/TripActivity';
import GroupMember from '../models/GroupMember';
import WantToGo from '../models/WantToGo';
import GroupPlace from '../models/GroupPlace';
import Place from '../models/Place';
import { TripGenerationRequest, TripGenerationResponse } from '../types/shared';

const router = Router();

// Helper function to check if user can access trip
async function canAccessTrip(userId: string, trip: ITrip): Promise<boolean> {
  // User is trip creator
  if (trip.creator === userId) return true;

  // User is in trip editors (for group trips)
  if (trip.editors.includes(userId)) return true;

  return false;
}

// Helper function to log trip activity
async function logTripActivity(
  tripId: string,
  userId: string,
  type: string,
  description: string,
  changes?: any,
  affectedDay?: string,
  affectedPlace?: string
): Promise<void> {
  try {
    await TripActivity.create({
      trip: tripId,
      user: userId,
      type,
      description,
      changes,
      affectedDay,
      affectedPlace,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to log trip activity:', error);
    // Don't fail the operation if logging fails
  }
}

/**
 * @swagger
 * /api/trips/generate:
 *   post:
 *     summary: Generate a new trip from saved places
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
 *               - destinations
 *               - durationDays
 *               - sourcePlaces
 *             properties:
 *               destinations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - location
 *                     - order
 *               durationDays:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 30
 *               sourcePlaces:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - savedPlaceId
 *                     - savedPlaceType
 *               preferences:
 *                 type: object
 *               groupId:
 *                 type: string
 */
router.post('/generate',
  authenticate,
  [
    body('destinations').isArray({ min: 1 }).withMessage('At least one destination required'),
    body('destinations.*.name').notEmpty().withMessage('Destination name required'),
    body('destinations.*.location.lat').isNumeric().withMessage('Valid latitude required'),
    body('destinations.*.location.lng').isNumeric().withMessage('Valid longitude required'),
    body('destinations.*.order').isNumeric().withMessage('Destination order required'),
    body('durationDays').isInt({ min: 1, max: 30 }).withMessage('Duration must be 1-30 days'),
    body('sourcePlaces').isArray({ min: 1 }).withMessage('At least one place required'),
    body('sourcePlaces.*.savedPlaceId').notEmpty().withMessage('Saved place ID required'),
    body('sourcePlaces.*.savedPlaceType').isIn(['personal', 'group']).withMessage('Valid place type required')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const {
        destinations,
        durationDays,
        sourcePlaces,
        preferences = {},
        groupId
      }: TripGenerationRequest = req.body;

      const userId = req.user?.id;

      // Check group permissions if creating group trip
      if (groupId) {
        const membership = await GroupMember.findOne({
          group_id: groupId,
          user_id: userId,
          status: 'active'
        });

        if (!membership) {
          return res.status(403).json({ message: 'Not authorized to create trips for this group' });
        }
      }

      // Validate all source places exist and user has access
      for (const sourcePlace of sourcePlaces) {
        let placeExists = false;

        if (sourcePlace.savedPlaceType === 'personal') {
          const wantToGo = await WantToGo.findOne({
            _id: sourcePlace.savedPlaceId,
            user_id: userId
          });
          placeExists = !!wantToGo;
        } else if (sourcePlace.savedPlaceType === 'group' && groupId) {
          const groupPlace = await GroupPlace.findOne({
            _id: sourcePlace.savedPlaceId,
            group_id: groupId
          });
          placeExists = !!groupPlace;
        }

        if (!placeExists) {
          return res.status(400).json({
            message: `Invalid source place: ${sourcePlace.savedPlaceId}`
          });
        }
      }

      // Generate basic trip structure (TODO: Implement sophisticated algorithm)
      const trip = await Trip.create({
        title: `Trip to ${destinations[0].name}`,
        creator: userId,
        group: groupId || undefined,
        destinations,
        durationDays,
        preferences,
        sourcePlaces,
        status: 'planning'
      });

      // Create trip days
      const tripDays = [];
      for (let i = 1; i <= durationDays; i++) {
        const tripDay = await TripDay.create({
          trip: trip._id,
          dayNumber: i,
          title: `Day ${i}`,
          focus: i === 1 ? 'travel' : 'attractions'
        });
        tripDays.push(tripDay);
      }

      // Basic place distribution (TODO: Implement smart algorithm)
      const placesPerDay = Math.ceil(sourcePlaces.length / durationDays);
      let placeIndex = 0;

      for (const day of tripDays) {
        const dayPlaces = sourcePlaces.slice(placeIndex, placeIndex + placesPerDay);
        placeIndex += placesPerDay;

        for (let i = 0; i < dayPlaces.length; i++) {
          const sourcePlace = dayPlaces[i];
          const order = i + 1;

          // Get place details
          let placeData;
          if (sourcePlace.savedPlaceType === 'personal') {
            placeData = await WantToGo.findById(sourcePlace.savedPlaceId);
          } else {
            placeData = await GroupPlace.findById(sourcePlace.savedPlaceId);
          }

          if (placeData) {
            const placeDetails = await Place.findOne({ place_id: placeData.place_id });

            await TripPlace.create({
              trip: trip._id,
              tripDay: day._id,
              place: placeDetails?._id || sourcePlace.savedPlaceId,
              order,
              estimatedDuration: 60, // Default 1 hour
              priority: 'medium',
              status: 'planned',
              placeSnapshot: placeDetails ? {
                place_id: placeDetails.place_id,
                name: placeDetails.name,
                formatted_address: placeDetails.formatted_address,
                location: placeDetails.location,
                rating: placeDetails.rating,
                types: placeDetails.types,
                price_level: placeDetails.price_level
              } : undefined
            });
          }
        }
      }

      // Update trip statistics
      const totalPlaces = sourcePlaces.length;
      await Trip.findByIdAndUpdate(trip._id, {
        totalPlaces,
        estimatedDuration: totalPlaces * 60 // Rough estimate
      });

      // Log activity
      await logTripActivity(
        (trip._id as any).toString(),
        userId!,
        'trip_created',
        `Created trip "${trip.title}" with ${totalPlaces} places over ${durationDays} days`
      );

      res.status(201).json({
        message: 'Trip generated successfully',
        trip,
        days: tripDays
      });

    } catch (error) {
      console.error('Error generating trip:', error);
      res.status(500).json({ message: 'Failed to generate trip' });
    }
  });

/**
 * @swagger
 * /api/trips:
 *   get:
 *     summary: Get user's trips
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [planning, confirmed, active, completed, cancelled]
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 */
router.get('/',
  authenticate,
  [
    query('status').optional().isIn(['planning', 'confirmed', 'active', 'completed', 'cancelled']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { status, groupId, limit = 20, offset = 0 } = req.query;
      const userId = req.user?.id;

      // Build query - user must be creator or editor
      const query: any = {
        $or: [
          { creator: userId },
          { editors: userId }
        ]
      };

      if (status) query.status = status;
      if (groupId) query.group = groupId;

      const trips = await Trip.find(query)
        .sort({ updatedAt: -1 })
        .limit(Number(limit))
        .skip(Number(offset))
        .select('-sourcePlaces'); // Don't include full source places in list

      res.json(trips);

    } catch (error) {
      console.error('Error fetching trips:', error);
      res.status(500).json({ message: 'Failed to fetch trips' });
    }
  });

/**
 * @swagger
 * /api/trips/{id}:
 *   get:
 *     summary: Get trip details
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id',
  authenticate,
  [param('id').isMongoId().withMessage('Invalid trip ID')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { id } = req.params;
      const userId = req.user?.id;

      const trip = await Trip.findById(id);
      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }

      // Check permissions
      if (!(await canAccessTrip(userId!, trip))) {
        return res.status(403).json({ message: 'Not authorized to view this trip' });
      }

      // Get trip days and places
      const days = await TripDay.find({ trip: id }).sort({ dayNumber: 1 });
      const places = await TripPlace.find({ trip: id }).sort({ tripDay: 1, order: 1 });

      // Get recent activities
      const activities = await TripActivity.find({ trip: id })
        .sort({ timestamp: -1 })
        .limit(20)
        .populate('user', 'name profilePicture');

      res.json({
        trip,
        days,
        places,
        activities
      });

    } catch (error) {
      console.error('Error fetching trip details:', error);
      res.status(500).json({ message: 'Failed to fetch trip details' });
    }
  });

/**
 * @swagger
 * /api/trips/{id}:
 *   put:
 *     summary: Update trip
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [planning, confirmed, active, completed, cancelled]
 *               preferences:
 *                 type: object
 */
router.put('/:id',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid trip ID'),
    body('title').optional().isLength({ min: 1, max: 100 }),
    body('description').optional().isLength({ max: 500 }),
    body('status').optional().isIn(['planning', 'confirmed', 'active', 'completed', 'cancelled'])
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { id } = req.params;
      const { title, description, status, preferences } = req.body;
      const userId = req.user?.id;

      const trip = await Trip.findById(id);
      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }

      // Check permissions
      if (!(await canAccessTrip(userId!, trip))) {
        return res.status(403).json({ message: 'Not authorized to edit this trip' });
      }

      // Track changes for activity log
      const changes: any = {};
      if (title && title !== trip.title) changes.title = { old: trip.title, new: title };
      if (description !== undefined && description !== trip.description) {
        changes.description = { old: trip.description, new: description };
      }
      if (status && status !== trip.status) changes.status = { old: trip.status, new: status };

      // Update trip
      const updateData: any = {};
      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (status) updateData.status = status;
      if (preferences) updateData.preferences = { ...trip.preferences, ...preferences };

      const updatedTrip = await Trip.findByIdAndUpdate(id, updateData, { new: true });

      // Log activity
      if (Object.keys(changes).length > 0) {
        await logTripActivity(
          id,
          userId!,
          'trip_updated',
          'Updated trip details',
          changes
        );
      }

      res.json(updatedTrip);

    } catch (error) {
      console.error('Error updating trip:', error);
      res.status(500).json({ message: 'Failed to update trip' });
    }
  });

/**
 * @swagger
 * /api/trips/{id}:
 *   delete:
 *     summary: Delete trip (soft delete)
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:id',
  authenticate,
  [param('id').isMongoId().withMessage('Invalid trip ID')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { id } = req.params;
      const userId = req.user?.id;

      const trip = await Trip.findById(id);
      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }

      // Check permissions - only creator can delete
      if (trip.creator !== userId) {
        return res.status(403).json({ message: 'Only trip creator can delete the trip' });
      }

      // Soft delete - mark as cancelled
      await Trip.findByIdAndUpdate(id, { status: 'cancelled' });

      // Log activity
      await logTripActivity(
        id,
        userId!,
        'trip_deleted',
        'Trip deleted'
      );

      res.json({ message: 'Trip deleted successfully' });

    } catch (error) {
      console.error('Error deleting trip:', error);
      res.status(500).json({ message: 'Failed to delete trip' });
    }
  });

export default router;
