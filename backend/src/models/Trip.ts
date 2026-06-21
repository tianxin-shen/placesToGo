import mongoose, { Schema, Document } from 'mongoose';

export interface ITrip extends Document {
  // Basic trip info
  title: string;
  description?: string;

  // Relationships
  creator: string; // Reference to User
  group?: string;  // Optional: Reference to Group (for group trips)

  // Trip configuration - can have multiple destinations
  destinations: Array<{
    name: string;
    location: {
      lat: number;
      lng: number;
    };
    order: number; // Order of destinations in trip
  }>;

  // Trip parameters used for generation
  durationDays: number; // Total trip length in days
  preferences: {
    pace: 'relaxed' | 'moderate' | 'intense'; // Activity intensity
    interests: string[]; // Preferred activity types
    budget: 'budget' | 'moderate' | 'luxury';
    transport: 'walking' | 'public' | 'driving' | 'mixed';
  };

  // Trip status and metadata
  status: 'planning' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  isPublic: boolean; // Can other users view this trip?
  tags: string[]; // Custom tags for organization

  // Collaboration (for group trips)
  editors: string[]; // Users who can edit this trip (group members)

  // Trip statistics (populated after generation)
  totalPlaces: number;
  estimatedDuration: number; // Total estimated time in minutes
  estimatedCost?: number; // Estimated cost if available

  // Source data - references to saved places (WantToGo or GroupPlace)
  sourcePlaces: Array<{
    placeId: string; // Reference to Place document
    savedPlaceId: string; // Reference to WantToGo or GroupPlace document
    savedPlaceType: 'personal' | 'group'; // Which collection the saved place is from
  }>;

  createdAt: Date;
  updatedAt: Date;
}

const TripSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },

  // Relationships
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  group: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    index: true
  },

  // Trip configuration - multiple destinations
  destinations: [{
    name: { type: String, required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    order: { type: Number, required: true, min: 1 }
  }],

  durationDays: {
    type: Number,
    required: true,
    min: 1,
    max: 30 // Reasonable max for trip planning
  },

  preferences: {
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
      ]
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

  // Status and metadata
  status: {
    type: String,
    enum: ['planning', 'confirmed', 'active', 'completed', 'cancelled'],
    default: 'planning',
    index: true
  },

  isPublic: {
    type: Boolean,
    default: false
  },

  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  // Collaboration
  editors: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Trip statistics
  totalPlaces: {
    type: Number,
    default: 0
  },
  estimatedDuration: {
    type: Number,
    default: 0 // in minutes
  },
  estimatedCost: {
    type: Number,
    min: 0
  },

  // Source data - references to saved places
  sourcePlaces: [{
    placeId: {
      type: Schema.Types.ObjectId,
      ref: 'Place',
      required: true
    },
    savedPlaceId: {
      type: Schema.Types.ObjectId,
      required: true
      // Note: This can reference either WantToGo or GroupPlace
      // We'll handle the dynamic reference in the application logic
    },
    savedPlaceType: {
      type: String,
      enum: ['personal', 'group'],
      required: true
    }
  }]

}, {
  timestamps: true
});

// Middleware to populate editors for group trips
TripSchema.pre('save', async function(this: ITrip, next) {
  // If this is a group trip and editors array is empty, populate it
  if (this.group && (!this.editors || this.editors.length === 0)) {
    try {
      const GroupMember = mongoose.model('GroupMember');
      const groupMembers = await GroupMember.find({
        group_id: this.group,
        status: 'active',
        role: { $in: ['owner', 'editor'] }
      }).select('user_id');

      this.editors = groupMembers.map(member => member.user_id.toString());
    } catch (error) {
      console.error('Error populating trip editors:', error);
      // Don't fail the save, just log the error
    }
  }
  next();
});

// Validation middleware to ensure savedPlaceId references are valid
TripSchema.pre('save', async function(this: ITrip, next) {
  if (this.sourcePlaces && this.sourcePlaces.length > 0) {
    try {
      const WantToGo = mongoose.model('WantToGo');
      const GroupPlace = mongoose.model('GroupPlace');

      for (const sourcePlace of this.sourcePlaces) {
        let isValid = false;

        if (sourcePlace.savedPlaceType === 'personal') {
          // Check if WantToGo document exists and belongs to trip creator
          const wantToGoDoc = await WantToGo.findOne({
            _id: sourcePlace.savedPlaceId,
            user_id: this.creator
          });
          isValid = !!wantToGoDoc;
        } else if (sourcePlace.savedPlaceType === 'group') {
          // Check if GroupPlace document exists and belongs to the trip's group
          const groupPlaceDoc = await GroupPlace.findOne({
            _id: sourcePlace.savedPlaceId,
            group_id: this.group
          });
          isValid = !!groupPlaceDoc;
        }

        if (!isValid) {
          return next(new Error(`Invalid saved place reference: ${sourcePlace.savedPlaceId}`));
        }
      }
    } catch (error) {
      console.error('Error validating saved place references:', error);
      return next(error as Error);
    }
  }
  next();
});

// Compound indexes for efficient queries
TripSchema.index({ creator: 1, status: 1 });
TripSchema.index({ group: 1, status: 1 });
TripSchema.index({ 'destinations.location': 1 }); // For location-based queries
TripSchema.index({ tags: 1 });
TripSchema.index({ editors: 1 }); // For permission checks

export default mongoose.model<ITrip>('Trip', TripSchema);
