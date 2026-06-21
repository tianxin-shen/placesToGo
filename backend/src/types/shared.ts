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
  
  // Enhanced fields similar to WantToGo
  location_group?: string;
  type_group?: string;
  year_group?: number;
  notes?: string;
  priority?: number;
  status: 'pending' | 'visited' | 'cancelled' | 'removed';
  plannedVisitDate?: Date;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

// Trip-related types
export interface Trip {
  id: string;
  title: string;
  description?: string;

  // Relationships
  creator: string; // User ID
  group?: string;  // Group ID (optional for group trips)

  // Trip configuration - multiple destinations
  destinations: Array<{
    name: string;
    location: Location;
    order: number;
  }>;

  durationDays: number;
  preferences: {
    pace: 'relaxed' | 'moderate' | 'intense';
    interests: string[];
    budget: 'budget' | 'moderate' | 'luxury';
    transport: 'walking' | 'public' | 'driving' | 'mixed';
  };

  // Status and metadata
  status: 'planning' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  isPublic: boolean;
  tags: string[];

  // Collaboration
  editors: string[]; // User IDs who can edit

  // Statistics
  totalPlaces: number;
  estimatedDuration: number;
  estimatedCost?: number;

  // Source data - references to saved places
  sourcePlaces: Array<{
    placeId: string; // Place document ID
    savedPlaceId: string; // WantToGo or GroupPlace document ID
    savedPlaceType: 'personal' | 'group';
  }>;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

export interface TripDay {
  id: string;
  trip: string; // Trip ID
  dayNumber: number;

  // Configuration
  date?: Date;
  title?: string;
  description?: string;

  // Schedule
  startTime?: string;
  endTime?: string;

  // Statistics
  totalPlaces: number;
  estimatedDuration: number;
  estimatedCost?: number;

  // Preferences
  focus?: string;
  pace?: 'relaxed' | 'moderate' | 'intense';

  // Status
  isRestDay: boolean;
  isTravelDay: boolean;

  // Location
  location?: {
    name: string;
    lat: number;
    lng: number;
  };

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

export interface TripPlace {
  id: string;
  trip: string;      // Trip ID
  tripDay: string;   // TripDay ID
  place: string;     // Place ID

  // Scheduling
  order: number;
  startTime?: string;
  endTime?: string;
  estimatedDuration: number;

  // Visit details
  notes?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'planned' | 'visited' | 'skipped' | 'cancelled';

  // Cost and logistics
  estimatedCost?: number;

  // Navigation to next place
  nextPlaceNavigation?: {
    mode: 'walking' | 'public' | 'taxi' | 'driving' | 'other';
    duration: number;
    distance?: number;
    instructions?: string;
    notes?: string;
  };

  // Place snapshot
  placeSnapshot: {
    place_id: string;
    name: string;
    formatted_address: string;
    location: Location;
    rating?: number;
    types: string[];
    price_level?: number;
  };

  // Customizations
  customName?: string;
  customNotes?: string;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

export interface TripPreferences {
  id: string;
  user: string; // User ID

  // Default preferences
  defaultPreferences: {
    pace: 'relaxed' | 'moderate' | 'intense';
    interests: string[];
    budget: 'budget' | 'moderate' | 'luxury';
    transport: 'walking' | 'public' | 'driving' | 'mixed';
  };

  // Scheduling preferences
  scheduling: {
    preferredStartTime: string;
    preferredEndTime: string;
    maxActivitiesPerDay: number;
    includeBreaks: boolean;
    breakDuration: number;
  };

  // Activity preferences
  activities: {
    maxTravelTime: number;
    prioritizeRating: boolean;
    avoidCrowds: boolean;
    dietaryRestrictions: string[];
  };

  // Notification preferences
  notifications: {
    reminderBeforeActivity: number;
    weatherAlerts: boolean;
    trafficAlerts: boolean;
  };

  // Advanced preferences
  advanced: {
    optimizationWeight: {
      rating: number;
      distance: number;
      popularity: number;
      cost: number;
    };
    customRules: string[];
  };

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

// Trip activity types
export type TripActivityType =
  | 'trip_created' | 'trip_updated' | 'trip_deleted' | 'trip_status_changed' | 'trip_preferences_updated'
  | 'day_added' | 'day_updated' | 'day_deleted' | 'day_reordered'
  | 'place_added' | 'place_updated' | 'place_removed' | 'place_reordered' | 'place_status_changed'
  | 'editor_added' | 'editor_removed'
  | 'comment_added' | 'comment_updated' | 'comment_deleted';

export interface TripActivity {
  id: string;
  trip: string; // Trip ID
  user: string; // User ID
  type: TripActivityType;
  description: string;
  affectedDay?: string; // TripDay ID
  affectedPlace?: string; // TripPlace ID
  changes?: {
    field?: string;
    oldValue?: any;
    newValue?: any;
    additionalData?: Record<string, any>;
  };
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Trip generation types
export interface TripGenerationRequest {
  destinations: Array<{
    name: string;
    location: Location;
    order: number;
  }>;
  durationDays: number;
  sourcePlaces: Array<{
    savedPlaceId: string; // WantToGo or GroupPlace ID
    savedPlaceType: 'personal' | 'group';
  }>;
  preferences?: Partial<TripPreferences['defaultPreferences']>;
  groupId?: string; // Optional: generate for group
}

export interface TripGenerationResponse {
  trip: Trip;
  days: TripDay[];
  places: TripPlace[];
  optimizationNotes?: string[];
} 