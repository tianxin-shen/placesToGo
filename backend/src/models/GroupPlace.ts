import mongoose, { Schema, Document } from 'mongoose';

export interface IGroupPlace extends Document {
  group_id: mongoose.Types.ObjectId;
  place_id: string;
  added_by: mongoose.Types.ObjectId;
  removed_by?: mongoose.Types.ObjectId;
  status: 'active' | 'removed';
  notes?: string;
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
  status: {
    type: String,
    enum: ['active', 'removed'],
    default: 'active'
  },
  notes: {
    type: String
  },
  removed_by: {
    type: Schema.Types.ObjectId,
    ref: 'User'
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
