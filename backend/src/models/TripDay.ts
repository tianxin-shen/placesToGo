import mongoose, { Schema, Document } from 'mongoose';

export interface ITripDay extends Document {
  // Relationships
  trip: string; // Reference to Trip
  dayNumber: number; // Day 1, 2, 3... within the trip

  // Day configuration
  date?: Date; // Optional: specific date if planned for actual dates
  title?: string; // Optional: custom day title (e.g., "Arrival Day", "Adventure Day")
  description?: string; // Optional: day description

  // Schedule information
  startTime?: string; // Planned start time (HH:MM format)
  endTime?: string; // Planned end time (HH:MM format)

  // Day statistics
  totalPlaces: number;
  estimatedDuration: number; // Total estimated time in minutes for this day
  estimatedCost?: number; // Estimated cost for this day

  // Day preferences (can override trip preferences)
  focus?: string; // Day focus (e.g., "food", "attractions", "relaxation")
  pace?: 'relaxed' | 'moderate' | 'intense'; // Override trip pace for this day

  // Day status
  isRestDay: boolean; // Is this a rest/recovery day?
  isTravelDay: boolean; // Is this primarily a travel day?

  // Location information (for multi-city trips)
  location?: {
    name: string;
    lat: number;
    lng: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

const TripDaySchema: Schema = new Schema({
  // Relationships
  trip: {
    type: Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    index: true
  },

  dayNumber: {
    type: Number,
    required: true,
    min: 1,
    index: true
  },

  // Day configuration
  date: {
    type: Date
  },

  title: {
    type: String,
    trim: true,
    maxlength: 50
  },

  description: {
    type: String,
    trim: true,
    maxlength: 200
  },

  // Schedule information
  startTime: {
    type: String,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },

  endTime: {
    type: String,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },

  // Day statistics
  totalPlaces: {
    type: Number,
    default: 0
  },

  estimatedDuration: {
    type: Number,
    default: 0, // in minutes
    min: 0
  },

  estimatedCost: {
    type: Number,
    min: 0
  },

  // Day preferences
  focus: {
    type: String,
    enum: [
      'food', 'attractions', 'nature', 'shopping', 'nightlife',
      'culture', 'sports', 'relaxation', 'adventure', 'history', 'travel'
    ]
  },

  pace: {
    type: String,
    enum: ['relaxed', 'moderate', 'intense']
  },

  // Day status
  isRestDay: {
    type: Boolean,
    default: false
  },

  isTravelDay: {
    type: Boolean,
    default: false
  },

  // Location information
  location: {
    name: String,
    lat: Number,
    lng: Number
  }

}, {
  timestamps: true
});

// Compound indexes for efficient queries
TripDaySchema.index({ trip: 1, dayNumber: 1 }, { unique: true }); // One day per trip
TripDaySchema.index({ trip: 1 }); // Get all days for a trip

export default mongoose.model<ITripDay>('TripDay', TripDaySchema);
