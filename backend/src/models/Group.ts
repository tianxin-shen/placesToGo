import mongoose, { Schema, Document } from 'mongoose';
import { generateShareCode } from '../utils/codeGenerator';

export interface IGroup extends Document {
  name: string;
  description?: string;
  shareCode: string;
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
      shareCode: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active',
    index: true
  }
}, {
  timestamps: true
});

// Ensure shareCode is unique
GroupSchema.index({ shareCode: 1 }, { unique: true });

export default mongoose.model<IGroup>('Group', GroupSchema);
