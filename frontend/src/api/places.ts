import { apiRequest, getFetchOptions } from './client';
import type { Place, ApiResponse, GroupPlace } from '../types/api';
import type { GooglePlaceResponse } from '../types/google';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface GetPlacesParams {
  limit?: number;
  page?: number;
}

// Get places from our database (requires auth)
export const getPlaces = async (params: GetPlacesParams = {}): Promise<ApiResponse<Place[]>> => {
  const { limit = 10, page = 1 } = params;
  return apiRequest<ApiResponse<Place[]>>(
    `/places?limit=${limit}&page=${page}`,
    getFetchOptions('GET')
  );
};

// Get place suggestions from Google Places API (public endpoint)
export const getPlaceAutocomplete = async (input: string) => {
  const response = await fetch(
    'https://places.googleapis.com/v1/places:autocomplete',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'suggestions.placePrediction.place,suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.types'
      },
      body: JSON.stringify({
        input,
        locationBias: {
          circle: {
            center: {
              latitude: 37.7749,  // San Francisco coordinates as default
              longitude: -122.4194
            },
            radius: 50000.0  // 50km radius
          }
        }
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Google Places Autocomplete API error:', errorData);
    throw new Error('Failed to fetch place suggestions');
  }

  return response.json();
};

interface SavePlaceParams {
  place_id: string;
  notes?: string;
  priority?: number;
  // For personal list
  user_id?: string;
  location_group?: string;
  // For group list
  group_id?: string;
  type_group?: string;
  year_group?: number;
  plannedVisitDate?: Date;
}

// Get detailed place information from Google Places API (public endpoint)
export const getPlaceDetailsFromGoogle = async (placeId: string): Promise<ApiResponse<GooglePlaceResponse>> => {
  const response = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,rating,userRatingCount,priceLevel,regularOpeningHours,photos'
      }
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Google Places API error:', errorData);
    throw new Error('Failed to fetch place details from Google Places API');
  }

  const data = await response.json();
  return { data };
};

// Save place to personal or group list (requires auth)
export const savePlaceToList = async (params: SavePlaceParams): Promise<ApiResponse<Place | GroupPlace>> => {
  if (params.group_id) {
    // Save to group list
    return apiRequest<ApiResponse<GroupPlace>>(
      `/groups/${params.group_id}/places`,
      getFetchOptions('POST', {
        place_id: params.place_id,
        notes: params.notes,
        location_group: params.location_group,
        type_group: params.type_group,
        year_group: params.year_group,
        priority: params.priority,
        plannedVisitDate: params.plannedVisitDate
      })
    );
  } else if (params.user_id) {
    // Save to personal list
    return apiRequest<ApiResponse<Place>>(
      '/want-to-go',
      getFetchOptions('POST', {
        place_id: params.place_id,
        user_id: params.user_id,
        location_group: params.location_group,
        priority: params.priority
      })
    );
  } else {
    throw new Error('Either group_id or user_id must be provided');
  }
};