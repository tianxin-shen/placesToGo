import { apiRequest, getFetchOptions } from './client';
import type { Place, ApiResponse} from '../types/api';
import type { GooglePlaceResponse } from '../types/google';

interface GetPlacesParams {
  limit?: number;
  page?: number;
}

interface AutocompleteResponse {
  suggestions: Array<{
    placePrediction?: {
      place: string;
      placeId: string;
      text: {
        text: string;
        matches: Array<{
          endOffset: number;
        }>;
      };
      structuredFormat: {
        mainText: {
          text: string;
          matches: Array<{
            endOffset: number;
          }>;
        };
        secondaryText: {
          text: string;
        };
      };
      types: string[];
      distanceMeters?: number;
    };
    queryPrediction?: {
      text: {
        text: string;
        matches: Array<{
          endOffset: number;
        }>;
      };
    };
  }>;
}

export const getPlaces = async (params: GetPlacesParams = {}): Promise<ApiResponse<Place[]>> => {
  const { limit = 10, page = 1 } = params;
  return apiRequest<ApiResponse<Place[]>>(
    `/places?limit=${limit}&page=${page}`,
    getFetchOptions('GET')
  );
};

export const getPlaceAutocomplete = async (input: string): Promise<AutocompleteResponse> => {
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

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

export const getPlaceDetailsFromGoogle = async (placeId: string): Promise<ApiResponse<GooglePlaceResponse>> => {
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Format fields as a comma-separated string without quotes
  const fields = [
    'id',
    'displayName',
    'formattedAddress',
    'rating',
    'userRatingCount',
    'priceLevel',
    'regularOpeningHours',
    'photos'
  ].join(',');

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': fields
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