import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { body } from 'express-validator';
import User from '../models/User';
import Session from '../models/Session';
import WantToGo from '../models/WantToGo';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth';
import { UserProfile } from '../types/shared';

const router = Router();

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Authenticate with Google
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Google ID token
 *     responses:
 *       200:
 *         description: Authentication successful
 *       400:
 *         description: Invalid token
 *       401:
 *         description: Authentication failed
 */
router.post('/google',
  [
    body('token').notEmpty().withMessage('Google token is required')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;

      // Verify Google token
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      if (!payload) {
        res.status(400).json({ message: 'Invalid token' });
        return;
      }

      const { sub: googleId, email, name, picture } = payload;

      // Find or create user
      let user = await User.findOne({ 'authMethods.google.id': googleId });
      
      if (!user) {
        // Check if user exists with this email
        user = await User.findOne({ email });
        
        if (user) {
          // Add Google auth to existing user
          user.authMethods.google = {
            id: googleId,
            email: email!
          };
        } else {
          // Create new user
          user = new User({
            email: email!,
            name: name!,
            profilePicture: picture,
            authMethods: {
              google: {
                id: googleId,
                email: email!
              }
            }
          });
        }
        await user.save();
      }

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      // Create session
      const session = new Session({
        userId: user._id,
        token: jwt.sign(
          { userId: user._id, role: user.role },
          process.env.JWT_SECRET!,
          { expiresIn: '1h' }
        ),
        refreshToken: jwt.sign(
          { userId: user._id },
          process.env.JWT_REFRESH_SECRET!,
          { expiresIn: '7d' }
        ),
        authMethod: 'google',
        device: {
          type: 'other', // TODO: Add device detection
          ip: req.ip
        },
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
        refreshExpiresAt: new Date(Date.now() + 7 * 24 * 3600000) // 7 days
      });
      await session.save();

      // Return user data and tokens
      res.json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          profilePicture: user.profilePicture,
          role: user.role
        },
        token: session.token,
        refreshToken: session.refreshToken
      });

    } catch (error) {
      console.error('Google auth error:', error);
      res.status(401).json({ message: 'Authentication failed' });
    }
  }
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };
      
      // Find session
      const session = await Session.findOne({
        refreshToken,
        status: 'active',
        refreshExpiresAt: { $gt: new Date() }
      });

      if (!session) {
        res.status(401).json({ message: 'Invalid refresh token' });
        return;
      }

      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        res.status(401).json({ message: 'User not found' });
        return;
      }

      // Create new session
      const newSession = new Session({
        userId: user._id,
        token: jwt.sign(
          { userId: user._id, role: user.role },
          process.env.JWT_SECRET!,
          { expiresIn: '1h' }
        ),
        refreshToken: jwt.sign(
          { userId: user._id },
          process.env.JWT_REFRESH_SECRET!,
          { expiresIn: '7d' }
        ),
        authMethod: session.authMethod,
        device: session.device,
        expiresAt: new Date(Date.now() + 3600000),
        refreshExpiresAt: new Date(Date.now() + 7 * 24 * 3600000)
      });
      await newSession.save();

      // Invalidate old session
      session.status = 'revoked';
      await session.save();

      res.json({
        token: newSession.token,
        refreshToken: newSession.refreshToken
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({ message: 'Invalid refresh token' });
    }
  }
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Not authenticated
 */
router.post('/logout',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.session) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }

      // Invalidate session
      req.session.status = 'revoked';
      await req.session.save();

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Error during logout' });
    }
  }
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   $ref: '#/components/schemas/AuthError'
 */
router.get('/me',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'NOT_AUTHENTICATED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      // Transform user data to match UserProfile interface, excluding sensitive fields
      const userProfile: UserProfile = {
        id: req.user._id.toString(),
        email: req.user.email,
        name: req.user.name,
        profilePicture: req.user.profilePicture,
        role: req.user.role,
        status: req.user.status,
        preferences: req.user.preferences,
        authMethods: {
          google: req.user.authMethods.google,
          email: req.user.authMethods.email ? {
            email: req.user.authMethods.email.email,
            verified: req.user.authMethods.email.verified
            // Excluding password field
          } : undefined,
          apple: req.user.authMethods.apple,
          facebook: req.user.authMethods.facebook
        },
        createdAt: req.user.createdAt.toISOString(),
        lastLoginAt: req.user.lastLoginAt?.toISOString()
      };

      res.json({ user: userProfile });
    } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve user profile'
        }
      });
    }
  }
);

/**
 * @swagger
 * /api/auth/migrate-anonymous-data:
 *   post:
 *     summary: Migrate anonymous user data to authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - anonymousUserId
 *               - places
 *             properties:
 *               anonymousUserId:
 *                 type: string
 *                 description: Guest user ID to migrate from
 *               places:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     place_id:
 *                       type: string
 *                     location_group:
 *                       type: string
 *                     type_group:
 *                       type: string
 *                     year_group:
 *                       type: number
 *                     notes:
 *                       type: string
 *                     priority:
 *                       type: number
 *                       minimum: 1
 *                       maximum: 5
 *                     status:
 *                       type: string
 *                       enum: [pending, visited, cancelled]
 *                     plannedVisitDate:
 *                       type: string
 *                       format: date-time
 *                     saved_at:
 *                       type: string
 *                       format: date-time
 *     responses:
 *       200:
 *         description: Data migrated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 migratedCount:
 *                   type: number
 *                 skippedCount:
 *                   type: number
 *                 details:
 *                   type: object
 *                   properties:
 *                     migrated:
 *                       type: array
 *                       items:
 *                         type: string
 *                     skipped:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Not authenticated
 */
router.post('/migrate-anonymous-data',
  authenticate,
  [
    body('anonymousUserId').notEmpty().withMessage('Anonymous user ID is required'),
    body('places').isArray({ min: 0 }).withMessage('Places must be an array'),
    body('places.*.place_id').notEmpty().withMessage('Place ID is required for each place'),
    body('places.*.priority').optional().isInt({ min: 1, max: 5 }).withMessage('Priority must be between 1 and 5'),
    body('places.*.status').optional().isIn(['pending', 'visited', 'cancelled']).withMessage('Invalid status')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'NOT_AUTHENTICATED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      const { anonymousUserId, places } = req.body;
      const authenticatedUserId = req.user._id.toString();

      if (!Array.isArray(places) || places.length === 0) {
        res.status(400).json({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Places array is required and cannot be empty'
          }
        });
        return;
      }

      // Get existing places for the authenticated user to check for duplicates
      const existingPlaces = await WantToGo.find({ user_id: authenticatedUserId });
      const existingPlaceIds = new Set(existingPlaces.map(p => p.place_id));

      const migrated: string[] = [];
      const skipped: string[] = [];

      // Process each place
      for (const placeData of places) {
        const { place_id, ...placeFields } = placeData;

        // Skip if place already exists for authenticated user
        if (existingPlaceIds.has(place_id)) {
          skipped.push(place_id);
          continue;
        }

        // Create new WantToGo entry for authenticated user
        const wantToGo = new WantToGo({
          place_id,
          user_id: authenticatedUserId,
          location_group: placeFields.location_group,
          type_group: placeFields.type_group,
          year_group: placeFields.year_group || new Date().getFullYear(),
          notes: placeFields.notes,
          priority: placeFields.priority,
          status: placeFields.status || 'pending',
          plannedVisitDate: placeFields.plannedVisitDate ? new Date(placeFields.plannedVisitDate) : undefined,
          saved_at: placeFields.saved_at ? new Date(placeFields.saved_at) : new Date()
        });

        await wantToGo.save();
        migrated.push(place_id);
      }

      res.json({
        message: 'Data migrated successfully',
        migratedCount: migrated.length,
        skippedCount: skipped.length,
        details: {
          migrated,
          skipped
        }
      });

    } catch (error) {
      console.error('Migration error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to migrate anonymous data'
        }
      });
    }
  }
);

export default router; 