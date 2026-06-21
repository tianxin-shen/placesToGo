import mongoose, { Schema, Document } from 'mongoose';

export type TripActivityType =
  // Trip-level activities
  | 'trip_created'
  | 'trip_updated'
  | 'trip_deleted'
  | 'trip_status_changed'
  | 'trip_preferences_updated'

  // Day-level activities
  | 'day_added'
  | 'day_updated'
  | 'day_deleted'
  | 'day_reordered'

  // Place-level activities
  | 'place_added'
  | 'place_updated'
  | 'place_removed'
  | 'place_reordered'
  | 'place_status_changed'

  // Collaboration activities
  | 'editor_added'
  | 'editor_removed'
  | 'comment_added'
  | 'comment_updated'
  | 'comment_deleted';

export interface ITripActivity extends Document {
  // Relationships
  trip: string; // Reference to Trip
  user: string; // User who performed the action

  // Activity details
  type: TripActivityType;
  description: string; // Human-readable description

  // Affected entities (optional, depending on activity type)
  affectedDay?: string; // Reference to TripDay
  affectedPlace?: string; // Reference to TripPlace

  // Change details (for tracking what changed)
  changes?: {
    field?: string; // Field that was changed
    oldValue?: any; // Previous value
    newValue?: any; // New value
    additionalData?: Record<string, any>; // Extra context
  };

  // Metadata
  timestamp: Date;
  ipAddress?: string; // For audit purposes
  userAgent?: string; // For audit purposes
}

const TripActivitySchema: Schema = new Schema({
  // Relationships
  trip: {
    type: Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    index: true
  },

  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Activity details
  type: {
    type: String,
    enum: [
      // Trip-level activities
      'trip_created',
      'trip_updated',
      'trip_deleted',
      'trip_status_changed',
      'trip_preferences_updated',

      // Day-level activities
      'day_added',
      'day_updated',
      'day_deleted',
      'day_reordered',

      // Place-level activities
      'place_added',
      'place_updated',
      'place_removed',
      'place_reordered',
      'place_status_changed',

      // Collaboration activities
      'editor_added',
      'editor_removed',
      'comment_added',
      'comment_updated',
      'comment_deleted'
    ],
    required: true
  },

  description: {
    type: String,
    required: true,
    maxlength: 500
  },

  // Affected entities
  affectedDay: {
    type: Schema.Types.ObjectId,
    ref: 'TripDay'
  },

  affectedPlace: {
    type: Schema.Types.ObjectId,
    ref: 'TripPlace'
  },

  // Change details
  changes: {
    field: String,
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
    additionalData: Schema.Types.Mixed
  },

  // Metadata
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },

  ipAddress: String,
  userAgent: String

}, {
  timestamps: false // We use custom timestamp field
});

// Compound indexes for efficient queries
TripActivitySchema.index({ trip: 1, timestamp: -1 }); // Recent activities for a trip
TripActivitySchema.index({ user: 1, timestamp: -1 }); // User's recent activities
TripActivitySchema.index({ type: 1, timestamp: -1 }); // Activities by type

// TTL index to automatically clean up old activities (90 days)
TripActivitySchema.index({ timestamp: 1 }, {
  expireAfterSeconds: 90 * 24 * 60 * 60
});

export default mongoose.model<ITripActivity>('TripActivity', TripActivitySchema);
