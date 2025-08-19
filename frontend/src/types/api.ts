// This file is auto-generated. Do not edit directly.
// Generated from backend shared types.
// Last generated: 2025-08-18T23:08:38.426Z

// Common types shared between frontend and backend

export interface Location {
  lat: number;
  lng: number;
}

export interface Maps {
  google: string;
  apple: string;
}

export interface Photo {
  name: string;           // Google Places photo resource name
  widthPx: number;        // Original width in pixels
  heightPx: number;       // Original height in pixels
  authorAttributions?: {  // Optional attribution information
    displayName: string;
    uri: string;
    photoUri: string;
  }[];
  // We don't store the actual URL as it needs to be generated with specific dimensions
  // and requires an API key. Instead, we'll generate it on demand.
}

export interface Review {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  profile_photo_url?: string;
}

export interface OpeningHours {
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
}

export interface Place {
  place_id: string;
  name: string;
  formatted_address: string;
  description: string;
  location: Location;
  maps: Maps;
  rating?: number;
  user_ratings_total?: number;
  photos: Photo[];
  types: string[];
  tags: string[];
  price_level?: number;
  opening_hours?: OpeningHours;
  website?: string;
  formatted_phone_number?: string;
  reviews?: Review[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Frontend-specific types
export interface PlacePreview {
  name: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  description: string;
  googleMapsUrl: string;
  appleMapsUrl: string;
  rating?: number;
  photoUrls?: string[];
  types?: string[];
  placeId?: string;
}

// Want to Go types
export interface WantToGoPlace {
  place_id: string;
  user_id: string;
  saved_at: Date;
  location_group?: string;
  type_group?: string;
  year_group?: number;
  notes?: string;
  priority?: number;
  status: 'pending' | 'visited' | 'cancelled';
  place?: Place;  // Populated place data
  createdAt?: Date;
  updatedAt?: Date;
}

// Authentication types
export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    profilePicture: string;
    role: string;
  };
  token: string; // access token
  refreshToken: string;
}

export interface GoogleLoginRequest {
  token: string; // Google ID token
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  role: "user" | "admin";
  status: "active" | "inactive" | "suspended";
  preferences?: {
    language?: string;
    timezone?: string;
    notifications?: boolean;
  };
  authMethods: {
    google?: { id: string; email: string };
    email?: { email: string; verified: boolean };
    apple?: { id: string; email: string };
    facebook?: { id: string; email: string };
  };
  createdAt: string;
  lastLoginAt?: string;
  // subscription?: TBD - will be added when subscription model is finalized
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

// Group types
export interface Group {
  id: string;
  name: string;
  description?: string;
  shareCode: string;
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'owner' | 'editor';
  status: 'active' | 'left';
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupPlace {
  id: string;
  group_id: string;
  place_id: string;
  added_by: string;
  removed_by?: string;
  status: 'active' | 'removed';
  notes?: string;
  created_at: Date;
  updated_at: Date;
} 
