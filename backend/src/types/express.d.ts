import { IUser } from '../models/User';
import { ISession } from '../models/Session';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      session?: ISession;
    }
  }
} 