import mongoose, { Schema, Document } from 'mongoose';

export interface IGroupPlace extends Document {
  group_id: string;
  place_id: string;
  added_by: string;
  removed_by?: string;
  
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

// Validation middleware to ensure business rules
groupPlaceSchema.pre('save', async function(this: IGroupPlace, next) {
  try {
    // Ensure group exists and is active
    const Group = mongoose.model('Group');
    const group = await Group.findById(this.group_id);
    if (!group) {
      return next(new Error('Group does not exist'));
    }
    if (group.status !== 'active') {
      return next(new Error('Cannot add places to inactive or archived group'));
    }

    // Ensure place exists in database
    const Place = mongoose.model('Place');
    const place = await Place.findOne({ place_id: this.place_id });
    if (!place) {
      return next(new Error('Place does not exist in database'));
    }

    // Ensure user (added_by) exists and is active member of group
    const GroupMember = mongoose.model('GroupMember');
    const membership = await GroupMember.findOne({
      group_id: this.group_id,
      user_id: this.added_by,
      status: 'active'
    });

    if (!membership) {
      return next(new Error('User is not an active member of this group'));
    }

    // If being removed, ensure removed_by is set and is a group member
    if (this.status === 'removed' && this.removed_by) {
      const removerMembership = await GroupMember.findOne({
        group_id: this.group_id,
        user_id: this.removed_by,
        status: 'active'
      });

      if (!removerMembership) {
        return next(new Error('User removing place is not an active member of this group'));
      }
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

const GroupPlace = mongoose.model<IGroupPlace>('GroupPlace', groupPlaceSchema);

export default GroupPlace;
