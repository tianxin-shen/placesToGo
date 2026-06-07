import mongoose, { Schema, Document } from 'mongoose';

export interface IItineraryItem {
  placeId: string;
  placeName: string;
  day: number;
  startTime?: string;
  endTime?: string;
  notes?: string;
  reason?: string;
}

export interface ITrip extends Document {
  userId: mongoose.Types.ObjectId;
  destination: string;
  startDate: Date;
  endDate: Date;
  travelerCount: number;
  preferences: {
    pace: 'relaxed' | 'moderate' | 'packed';
    focus: ('outdoor' | 'food' | 'culture' | 'mix')[];
  };
  keyPlaceIds: string[];
  status: 'draft' | 'published';
  itinerary: IItineraryItem[];
  shareToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ItineraryItemSchema = new Schema({
  placeId: { type: String, required: true },
  placeName: { type: String, required: true },
  day: { type: Number, required: true },
  startTime: String,
  endTime: String,
  notes: String,
  reason: String,
}, { _id: false });

const TripSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  destination: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  travelerCount: {
    type: Number,
    required: true,
    min: 1,
  },
  preferences: {
    pace: {
      type: String,
      enum: ['relaxed', 'moderate', 'packed'],
      required: true,
    },
    focus: [{
      type: String,
      enum: ['outdoor', 'food', 'culture', 'mix'],
    }],
  },
  keyPlaceIds: [{ type: String }],
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
    index: true,
  },
  itinerary: [ItineraryItemSchema],
  shareToken: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model<ITrip>('Trip', TripSchema);
