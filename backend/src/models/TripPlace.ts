import mongoose, { Schema, Document } from 'mongoose';

export interface ITripPlace extends Document {
  // Relationships
  trip: string;      // Reference to Trip
  tripDay: string;   // Reference to TripDay
  place: string;     // Reference to Place

  // Scheduling information
  order: number; // Order within the day (1, 2, 3...)
  startTime?: string; // Scheduled start time (HH:MM format)
  endTime?: string; // Scheduled end time (HH:MM format)
  estimatedDuration: number; // Estimated visit duration in minutes

  // Visit details
  notes?: string; // Custom notes for this visit
  priority: 'low' | 'medium' | 'high'; // Importance within the trip
  status: 'planned' | 'visited' | 'skipped' | 'cancelled'; // Visit status

  // Cost and logistics
  estimatedCost?: number; // Estimated cost for this place

  // Navigation to NEXT place (for consecutive places in same day)
  nextPlaceNavigation?: {
    mode: 'walking' | 'public' | 'taxi' | 'driving' | 'other';
    duration: number; // Travel time in minutes to next place
    distance?: number; // Distance in meters to next place
    instructions?: string; // Navigation instructions
    notes?: string; // Additional transportation notes
  };

  // Place metadata (copied from Place for performance)
  placeSnapshot: {
    place_id: string;
    name: string;
    formatted_address: string;
    location: {
      lat: number;
      lng: number;
    };
    rating?: number;
    types: string[];
    price_level?: number;
  };

  // User customizations
  customName?: string; // Override place name
  customNotes?: string; // Additional personal notes

  createdAt: Date;
  updatedAt: Date;
}

const TripPlaceSchema: Schema = new Schema({
  // Relationships
  trip: {
    type: Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    index: true
  },

  tripDay: {
    type: Schema.Types.ObjectId,
    ref: 'TripDay',
    required: true,
    index: true
  },

  place: {
    type: Schema.Types.ObjectId,
    ref: 'Place',
    required: true,
    index: true
  },

  // Scheduling information
  order: {
    type: Number,
    required: true,
    min: 1
  },

  startTime: {
    type: String,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },

  endTime: {
    type: String,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },

  estimatedDuration: {
    type: Number,
    required: true,
    min: 15, // Minimum 15 minutes
    max: 480, // Maximum 8 hours
    default: 60 // Default 1 hour
  },

  // Visit details
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },

  status: {
    type: String,
    enum: ['planned', 'visited', 'skipped', 'cancelled'],
    default: 'planned',
    index: true
  },

  // Cost and logistics
  estimatedCost: {
    type: Number,
    min: 0
  },

  // Navigation to next place
  nextPlaceNavigation: {
    mode: {
      type: String,
      enum: ['walking', 'public', 'taxi', 'driving', 'other'],
      default: 'walking'
    },
    duration: {
      type: Number,
      min: 0,
      default: 0 // in minutes
    },
    distance: {
      type: Number,
      min: 0 // in meters
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: 300
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 200
    }
  },

  // Place metadata snapshot
  placeSnapshot: {
    place_id: { type: String, required: true },
    name: { type: String, required: true },
    formatted_address: { type: String, required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    rating: { type: Number, min: 0, max: 5 },
    types: [{ type: String }],
    price_level: { type: Number, min: 0, max: 4 }
  },

  // User customizations
  customName: {
    type: String,
    trim: true,
    maxlength: 100
  },

  customNotes: {
    type: String,
    trim: true,
    maxlength: 300
  }

}, {
  timestamps: true
});

// Compound indexes for efficient queries
TripPlaceSchema.index({ trip: 1, tripDay: 1, order: 1 }); // Get places for a day in order
TripPlaceSchema.index({ trip: 1, status: 1 }); // Get places by status within trip
TripPlaceSchema.index({ place: 1 }); // Find all trips that include a place

export default mongoose.model<ITripPlace>('TripPlace', TripPlaceSchema);
