import mongoose, { Schema, Document } from 'mongoose';

export interface IGroupPlace extends Document {
  group_id: mongoose.Types.ObjectId;
  place_id: string;
  added_by: mongoose.Types.ObjectId;
  removed_by?: mongoose.Types.ObjectId;
  
  // Enhanced fields similar to WantToGo
  location_group?: string;  // e.g., "Hawaii", "Portland", "Nearby"
  type_group?: string;      // e.g., "activity", "restaurant", "attraction"
  year_group?: number;      // e.g., 2024, 2025
  notes?: string;
  priority?: number;        // Priority level 1-5
  status: 'pending' | 'visited' | 'cancelled' | 'removed';
  plannedVisitDate?: Date;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

const groupPlaceSchema = new Schema({
  group_id: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  place_id: {
    type: String,
    required: true
  },
  added_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  removed_by: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Enhanced fields similar to WantToGo
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
  notes: {
    type: String
  },
  priority: {
    type: Number,
    min: 1,
    max: 5
  },
  status: {
    type: String,
    enum: ['pending', 'visited', 'cancelled', 'removed'],
    default: 'pending',
    index: true
  },
  plannedVisitDate: {
    type: Date
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Create compound index for unique places per group
groupPlaceSchema.index({ group_id: 1, place_id: 1 }, { unique: true });

const GroupPlace = mongoose.model<IGroupPlace>('GroupPlace', groupPlaceSchema);

export default GroupPlace;
