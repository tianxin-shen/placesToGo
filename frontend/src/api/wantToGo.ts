import { apiRequest, getFetchOptions } from './client';
import type { WantToGoPlace, ApiResponse } from '../types/api';
import { 
  isAuthenticated, 
  getAnonymousWantToGoPlaces, 
  saveAnonymousWantToGoPlace, 
  removeAnonymousWantToGoPlace 
} from '../utils/userUtils';

interface GetWantToGoParams {
  user_id: string;
  status?: 'pending' | 'visited' | 'cancelled';
}

interface GetWantToGoGroupsParams {
  user_id: string;
  groupBy: 'location' | 'type' | 'year';
}

interface AddToWantToGoParams {
  place_id: string;
  user_id: string;
  location_group?: string;
  type_group?: string;
  notes?: string;
  priority?: number;
}

interface UpdateWantToGoParams {
  location_group?: string;
  type_group?: string;
  notes?: string;
  priority?: number;
  status?: 'pending' | 'visited' | 'cancelled';
}

// Helper function to group places by location
const groupPlacesByLocation = (places: any[]): Record<string, any[]> => {
  const groups: Record<string, any[]> = {};
  
  places.forEach(place => {
    const location = place.location_group || 'Unknown Location';
    if (!groups[location]) {
      groups[location] = [];
    }
    groups[location].push(place);
  });
  
  return groups;
};

// Get want-to-go places (handles both anonymous and authenticated users)
export const getWantToGoPlaces = async (params: GetWantToGoParams): Promise<ApiResponse<WantToGoPlace[]>> => {
  if (!isAuthenticated()) {
    // For anonymous users, return local storage data
    const places = getAnonymousWantToGoPlaces();
    return { data: places };
  }
  
  // For authenticated users, use API
  const queryParams = new URLSearchParams({
    user_id: params.user_id,
    ...(params.status && { status: params.status })
  });
  return apiRequest<ApiResponse<WantToGoPlace[]>>(
    `/want-to-go?${queryParams}`,
    getFetchOptions('GET')
  );
};

// Get want-to-go groups (handles both anonymous and authenticated users)
export const getWantToGoGroups = async (params: GetWantToGoGroupsParams): Promise<ApiResponse<Record<string, WantToGoPlace[]>>> => {
  if (!isAuthenticated()) {
    // For anonymous users, group local storage data
    const places = getAnonymousWantToGoPlaces();
    const groups = groupPlacesByLocation(places);
    return { data: groups };
  }
  
  // For authenticated users, use API
  const queryParams = new URLSearchParams({
    user_id: params.user_id,
    groupBy: params.groupBy
  });
  return apiRequest<ApiResponse<Record<string, WantToGoPlace[]>>>(
    `/want-to-go/groups?${queryParams}`,
    getFetchOptions('GET')
  );
};

// Add to want-to-go (handles both anonymous and authenticated users)
export const addToWantToGo = async (params: AddToWantToGoParams): Promise<ApiResponse<WantToGoPlace>> => {
  console.log('Adding to want to go:', params);
  
  if (!isAuthenticated()) {
    // For anonymous users, save to local storage
    const place = {
      ...params,
      saved_at: new Date(),
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    saveAnonymousWantToGoPlace(place);
    return { data: place };
  }
  
  // For authenticated users, use API
  return apiRequest<ApiResponse<WantToGoPlace>>(
    '/want-to-go',
    getFetchOptions('POST', params)
  );
};

// Remove from want-to-go (handles both anonymous and authenticated users)
export const removeFromWantToGo = async (placeId: string, userId: string): Promise<ApiResponse<void>> => {
  if (!isAuthenticated()) {
    // For anonymous users, remove from local storage
    removeAnonymousWantToGoPlace(placeId);
    return { data: undefined };
  }
  
  // For authenticated users, use API
  const queryParams = new URLSearchParams({ user_id: userId });
  return apiRequest<ApiResponse<void>>(
    `/want-to-go/${placeId}?${queryParams}`,
    getFetchOptions('DELETE')
  );
};

// Update want-to-go place (handles both anonymous and authenticated users)
export const updateWantToGoPlace = async (
  placeId: string,
  userId: string,
  updates: UpdateWantToGoParams
): Promise<ApiResponse<WantToGoPlace>> => {
  if (!isAuthenticated()) {
    // For anonymous users, update in local storage
    const places = getAnonymousWantToGoPlaces();
    const placeIndex = places.findIndex(place => place.place_id === placeId);
    
    if (placeIndex !== -1) {
      places[placeIndex] = {
        ...places[placeIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('anonymous_want_to_go', JSON.stringify(places));
      return { data: places[placeIndex] };
    }
    
    throw new Error('Place not found');
  }
  
  // For authenticated users, use API
  const queryParams = new URLSearchParams({ user_id: userId });
  return apiRequest<ApiResponse<WantToGoPlace>>(
    `/want-to-go/${placeId}?${queryParams}`,
    getFetchOptions('PATCH', updates)
  );
}; 