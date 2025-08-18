import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Session from '../models/Session';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any; // We'll type this properly after implementing
      session?: any;
    }
  }
}

// Verify JWT token and attach user to request
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { 
      userId: string;
      role: string;
    };

    // Find active session
    const session = await Session.findOne({
      token,
      status: 'active',
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      res.status(401).json({ message: 'Invalid or expired session' });
      return;
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // Check if user is active
    if (user.status !== 'active') {
      res.status(403).json({ message: 'User account is not active' });
      return;
    }

    // Attach user and session to request
    req.user = user;
    req.session = session;

    // Update last activity
    session.lastActivityAt = new Date();
    await session.save();

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expired' });
      return;
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Internal server error' });
    return;
  }
};
// Role-based access control
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// Optional authentication (for routes that can work with or without auth)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { 
      userId: string;
      role: string;
    };

    const session = await Session.findOne({
      token,
      status: 'active',
      expiresAt: { $gt: new Date() }
    });

    if (session) {
      const user = await User.findById(decoded.userId);
      if (user && user.status === 'active') {
        req.user = user;
        req.session = session;
        session.lastActivityAt = new Date();
        await session.save();
      }
    }

    next();
  } catch (error) {
    // Don't throw error for optional auth
    next();
  }
}; 