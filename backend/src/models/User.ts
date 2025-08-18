import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  name: string;
  profilePicture?: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  
  // Auth methods
  authMethods: {
    google?: {
      id: string;
      email: string;
    };
    email?: {
      email: string;
      password: string; // hashed
      verified: boolean;
    };
    apple?: {
      id: string;
      email: string;
    };
    facebook?: {
      id: string;
      email: string;
    };
  };
  
  // User preferences
  preferences?: {
    language?: string;
    timezone?: string;
    notifications?: boolean;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  profilePicture: String,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  authMethods: {
    google: {
      id: String,
      email: String
    },
    email: {
      email: String,
      password: String,
      verified: {
        type: Boolean,
        default: false
      }
    },
    apple: {
      id: String,
      email: String
    },
    facebook: {
      id: String,
      email: String
    }
  },
  preferences: {
    language: String,
    timezone: String,
    notifications: {
      type: Boolean,
      default: true
    }
  },
  lastLoginAt: Date
}, {
  timestamps: true
});

// Indexes
UserSchema.index({ 'authMethods.google.id': 1 });
UserSchema.index({ 'authMethods.apple.id': 1 });
UserSchema.index({ 'authMethods.facebook.id': 1 });
UserSchema.index({ status: 1 });

// Password comparison method
UserSchema.methods.comparePassword = async function(this: IUser, candidatePassword: string): Promise<boolean> {
  if (!this.authMethods.email?.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.authMethods.email.password);
};

// Hash password before saving
UserSchema.pre('save', async function(this: IUser, next) {
  if (this.isModified('authMethods.email.password') && this.authMethods.email?.password) {
    const salt = await bcrypt.genSalt(10);
    this.authMethods.email.password = await bcrypt.hash(this.authMethods.email.password, salt);
  }
  next();
});

export default mongoose.model<IUser>('User', UserSchema); 