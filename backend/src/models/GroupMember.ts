import mongoose, { Schema, Document } from 'mongoose';

export interface IGroupMember extends Document {
  group_id: string;
  user_id: string;
  role: 'owner' | 'editor';
  status: 'active' | 'pending' | 'left';
  joinedAt: Date;
  updatedAt: Date;
}

const GroupMemberSchema: Schema = new Schema({
  group_id: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['owner', 'editor'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'left'],
    default: 'pending',
    index: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for unique group membership
GroupMemberSchema.index({ group_id: 1, user_id: 1 }, { unique: true });

// Index for finding user's groups
GroupMemberSchema.index({ user_id: 1, status: 1 });

export default mongoose.model<IGroupMember>('GroupMember', GroupMemberSchema);
