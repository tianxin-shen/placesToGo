import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  userId: string;
  token: string;
  refreshToken: string;
  
  // Auth info
  authMethod: 'google' | 'email' | 'apple' | 'facebook';
  
  // Device info
  device: {
    type: 'mobile' | 'tablet' | 'desktop' | 'other';
    name?: string;
    os?: string;
    browser?: string;
    ip?: string;
  };
  
  // Status and security
  status: 'active' | 'expired' | 'revoked';
  expiresAt: Date;
  refreshExpiresAt: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
}

const SessionSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  refreshToken: {
    type: String,
    required: true,
    unique: true
  },
  authMethod: {
    type: String,
    enum: ['google', 'email', 'apple', 'facebook'],
    required: true
  },
  device: {
    type: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'other'],
      required: true
    },
    name: String,
    os: String,
    browser: String,
    ip: String
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked'],
    default: 'active'
  },
  expiresAt: {
    type: Date,
    required: true
  },
  refreshExpiresAt: {
    type: Date,
    required: true
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
SessionSchema.index({ userId: 1, status: 1 });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic cleanup

// Update lastActivityAt on save
SessionSchema.pre('save', function(next) {
  this.lastActivityAt = new Date();
  next();
});

export default mongoose.model<ISession>('Session', SessionSchema); 