import mongoose, { Schema, Document } from 'mongoose';

export interface ITripPreferences extends Document {
  // Relationships
  user: string; // Reference to User

  // Default trip generation preferences
  defaultPreferences: {
    pace: 'relaxed' | 'moderate' | 'intense';
    interests: string[]; // Preferred activity types
    budget: 'budget' | 'moderate' | 'luxury';
    transport: 'walking' | 'public' | 'driving' | 'mixed';
  };

  // Scheduling preferences
  scheduling: {
    preferredStartTime: string; // Default start time (HH:MM)
    preferredEndTime: string;   // Default end time (HH:MM)
    maxActivitiesPerDay: number; // Maximum activities per day
    includeBreaks: boolean;     // Include break times between activities
    breakDuration: number;      // Break duration in minutes
  };

  // Activity preferences
  activities: {
    maxTravelTime: number;      // Maximum travel time between activities (minutes)
    prioritizeRating: boolean;  // Prioritize highly-rated places
    avoidCrowds: boolean;       // Prefer less crowded times/places
    dietaryRestrictions: string[]; // Food-related restrictions
  };

  // Notification preferences
  notifications: {
    reminderBeforeActivity: number; // Minutes before activity to remind
    weatherAlerts: boolean;
    trafficAlerts: boolean;
  };

  // Advanced preferences (for future features)
  advanced: {
    optimizationWeight: {
      rating: number;     // Weight for place rating (0-1)
      distance: number;   // Weight for minimizing travel
      popularity: number; // Weight for popular places
      cost: number;       // Weight for cost optimization
    };
    customRules: string[]; // Custom generation rules (JSON strings)
  };

  createdAt: Date;
  updatedAt: Date;
}

const TripPreferencesSchema: Schema = new Schema({
  // Relationships
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // One preference set per user
    index: true
  },

  // Default trip generation preferences
  defaultPreferences: {
    pace: {
      type: String,
      enum: ['relaxed', 'moderate', 'intense'],
      default: 'moderate'
    },
    interests: [{
      type: String,
      enum: [
        'food', 'attractions', 'nature', 'shopping', 'nightlife',
        'culture', 'sports', 'relaxation', 'adventure', 'history'
      ],
      default: []
    }],
    budget: {
      type: String,
      enum: ['budget', 'moderate', 'luxury'],
      default: 'moderate'
    },
    transport: {
      type: String,
      enum: ['walking', 'public', 'driving', 'mixed'],
      default: 'mixed'
    }
  },

  // Scheduling preferences
  scheduling: {
    preferredStartTime: {
      type: String,
      default: '09:00',
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    preferredEndTime: {
      type: String,
      default: '18:00',
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    maxActivitiesPerDay: {
      type: Number,
      default: 6,
      min: 1,
      max: 12
    },
    includeBreaks: {
      type: Boolean,
      default: true
    },
    breakDuration: {
      type: Number,
      default: 30, // minutes
      min: 0,
      max: 120
    }
  },

  // Activity preferences
  activities: {
    maxTravelTime: {
      type: Number,
      default: 60, // minutes
      min: 5,
      max: 180
    },
    prioritizeRating: {
      type: Boolean,
      default: true
    },
    avoidCrowds: {
      type: Boolean,
      default: false
    },
    dietaryRestrictions: [{
      type: String,
      enum: ['vegetarian', 'vegan', 'gluten-free', 'halal', 'kosher', 'dairy-free'],
      default: []
    }]
  },

  // Notification preferences
  notifications: {
    reminderBeforeActivity: {
      type: Number,
      default: 15, // minutes
      min: 0,
      max: 120
    },
    weatherAlerts: {
      type: Boolean,
      default: true
    },
    trafficAlerts: {
      type: Boolean,
      default: true
    }
  },

  // Advanced preferences
  advanced: {
    optimizationWeight: {
      rating: {
        type: Number,
        default: 0.7,
        min: 0,
        max: 1
      },
      distance: {
        type: Number,
        default: 0.8,
        min: 0,
        max: 1
      },
      popularity: {
        type: Number,
        default: 0.5,
        min: 0,
        max: 1
      },
      cost: {
        type: Number,
        default: 0.3,
        min: 0,
        max: 1
      }
    },
    customRules: [{
      type: String,
      default: []
    }]
  }

}, {
  timestamps: true
});

export default mongoose.model<ITripPreferences>('TripPreferences', TripPreferencesSchema);
