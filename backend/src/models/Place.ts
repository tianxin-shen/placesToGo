import mongoose, { Schema, Document } from 'mongoose';

export interface IPlace extends Document {
  place_id: string;
  name: string;
  formatted_address: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  maps: {
    google: string;
    apple: string;
  };
  rating?: number;
  user_ratings_total?: number;
  photos: Array<{
    name: string;
    widthPx: number;
    heightPx: number;
    authorAttributions: Array<{
      displayName: string;
      uri: string;
      photoUri: string;
    }>;
  }>;
  types: string[];
  tags: string[];  // Custom tags like "Must visit", "Best photo", etc.
  price_level?: number;
  opening_hours?: {
    open_now: boolean;
    periods: Array<{
      open: {
        day: number;
        time: string;
      };
      close: {
        day: number;
        time: string;
      };
    }>;
    weekday_text: string[];
  };
  website?: string;
  formatted_phone_number?: string;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
    profile_photo_url?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const PlaceSchema: Schema = new Schema({
  place_id: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  formatted_address: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  maps: {
    google: { type: String, required: true },
    apple: { type: String, required: true }
  },
  rating: { 
    type: Number, 
    min: 0, 
    max: 5 
  },
  user_ratings_total: Number,
  photos: [{
    name: { type: String, required: true },
    widthPx: { type: Number, required: true },
    heightPx: { type: Number, required: true },
    authorAttributions: [{
      displayName: String,
      uri: String,
      photoUri: String
    }]
  }],
  types: [{ 
    type: String 
  }],
  tags: [{ 
    type: String,
    index: true  // Index for efficient tag-based queries
  }],
  price_level: { 
    type: Number, 
    min: 0, 
    max: 4 
  },
  opening_hours: {
    open_now: { type: Boolean, default: false },
    periods: [{
      open: {
        day: Number,
        time: String
      },
      close: {
        day: Number,
        time: String
      }
    }],
    weekday_text: [String]
  },
  website: String,
  formatted_phone_number: String,
  reviews: [{
    author_name: String,
    rating: Number,
    text: String,
    time: Number,
    profile_photo_url: String
  }]
}, {
  timestamps: true
});

// Indexes for common queries
PlaceSchema.index({ types: 1 });

export default mongoose.model<IPlace>('Place', PlaceSchema); 