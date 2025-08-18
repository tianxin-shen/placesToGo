import mongoose, { Schema, Document } from 'mongoose';

export interface IWantToGo extends Document {
  place_id: string;
  user_id: string;  // For guest users, this will be a browser-generated ID
  saved_at: Date;
  location_group?: string;  // e.g., "Hawaii", "Portland", "Nearby"
  type_group?: string;      // e.g., "activity", "restaurant", "attraction"
  year_group?: number;      // e.g., 2024, 2025
  notes?: string;
  priority?: number;        // Optional priority level
  status: 'pending' | 'visited' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  plannedVisitDate?: Date;
}

const WantToGoSchema: Schema = new Schema({
  place_id: { 
    type: String, 
    required: true,
    index: true   // Index for faster queries
  },
  user_id: { 
    type: String, 
    required: true,
    index: true   // Index for faster queries
  },
  saved_at: { 
    type: Date, 
    default: Date.now,
    required: true
  },
  location_group: { 
    type: String,
    index: true
  },
  type_group: { 
    type: String,
    index: true
  },
  year_group: { 
    type: Number,
    index: true
  },
  notes: String,
  priority: {
    type: Number,
    min: 1,
    max: 5
  },
  status: {
    type: String,
    enum: ['pending', 'visited', 'cancelled'],
    default: 'pending',
    index: true
  },
  plannedVisitDate: Date
}, {
  timestamps: true
});

// Compound index for efficient queries
WantToGoSchema.index({ user_id: 1, place_id: 1 }, { unique: true });

export default mongoose.model<IWantToGo>('WantToGo', WantToGoSchema); 