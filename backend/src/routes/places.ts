import { Router, Request, Response } from 'express';
import Place from '../models/Place';

const router = Router();

interface PlaceParams {
  placeId: string;
}

/**
 * @swagger
 * /api/places:
 *   get:
 *     summary: Get all places
 *     description: Retrieve a list of all tourist places
 *     tags: [Places]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of places to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: A list of places
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 places:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       place_id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       formatted_address:
 *                         type: string
 *                       rating:
 *                         type: number
 *                       photos:
 *                         type: array
 *                         items:
 *                           type: object
 *                 total:
 *                   type: number
 *                 page:
 *                   type: number
 *                 totalPages:
 *                   type: number
 *       500:
 *         description: Server error
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [places, total] = await Promise.all([
      Place.find()
        .skip(skip)
        .limit(limit),
      Place.countDocuments()
    ]);

    // Return just the places array to match frontend expectation
    res.json(places);
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ message: 'Error fetching places' });
  }
});

router.get('/:placeId', async (req: Request<PlaceParams>, res: Response): Promise<void> => {
  try {
    const place = await Place.findOne({ place_id: req.params.placeId });
    if (!place) {
      res.status(404).json({ message: 'Place not found' });
      return;
    }
    res.json(place);
  } catch (error) {
    console.error('Error fetching place:', error);
    res.status(500).json({ message: 'Error fetching place' });
  }
});

export default router; 