import mongoose, { Schema, Document } from 'mongoose';

export interface IGroupMember extends Document {
  group_id: string; // Will be converted to ObjectId by Mongoose
  user_id: string; // Will be converted to ObjectId by Mongoose
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

// Validation middleware to ensure business rules
GroupMemberSchema.pre('save', async function(this: IGroupMember, next) {
  try {
    // If this is a new document or status is changing to active
    if (this.isNew || this.isModified('status')) {
      if (this.status === 'active') {
        // Ensure group exists and is active
        const Group = mongoose.model('Group');
        const group = await Group.findById(this.group_id);
        if (!group) {
          return next(new Error('Group does not exist'));
        }
        if (group.status !== 'active') {
          return next(new Error('Cannot join inactive or archived group'));
        }

        // Ensure user exists and is active
        const User = mongoose.model('User');
        const user = await User.findById(this.user_id);
        if (!user) {
          return next(new Error('User does not exist'));
        }
        if (user.status !== 'active') {
          return next(new Error('Cannot add inactive user to group'));
        }
      }
    }

    // If changing role, ensure business rules
    if (this.isModified('role')) {
      if (this.role === 'owner') {
        // Check if there's already an owner for this group
        const existingOwner = await mongoose.model('GroupMember').findOne({
          group_id: this.group_id,
          role: 'owner',
          status: 'active',
          _id: { $ne: this._id } // Exclude current document
        });

        if (existingOwner) {
          return next(new Error('Group already has an owner'));
        }
      }
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Pre-remove middleware to prevent removing last owner
GroupMemberSchema.pre('save', async function(this: IGroupMember, next) {
  try {
    // If an owner is being deactivated or role changed from owner
    if (this.isModified('status') && this.status !== 'active' && this.role === 'owner') {
      // Check if there are other active owners
      const otherOwners = await mongoose.model('GroupMember').countDocuments({
        group_id: this.group_id,
        role: 'owner',
        status: 'active',
        _id: { $ne: this._id }
      });

      if (otherOwners === 0) {
        return next(new Error('Cannot remove last owner from group'));
      }
    }

    // If role is being changed from owner to something else
    if (this.isModified('role') && this.role !== 'owner') {
      const previousRole = this.getChanges().$set?.role;
      if (previousRole === 'owner') {
        // Check if there are other active owners
        const otherOwners = await mongoose.model('GroupMember').countDocuments({
          group_id: this.group_id,
          role: 'owner',
          status: 'active',
          _id: { $ne: this._id }
        });

        if (otherOwners === 0) {
          return next(new Error('Cannot change role of last owner'));
        }
      }
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

export default mongoose.model<IGroupMember>('GroupMember', GroupMemberSchema);
