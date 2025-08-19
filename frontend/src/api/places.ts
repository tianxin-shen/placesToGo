import { apiRequest, getFetchOptions } from './client';
import type { Place, ApiResponse, GroupPlace } from '../types/api';
import type { GooglePlaceResponse } from '../types/google';

interface SavePlaceParams {
  place_id: string;
  notes?: string;
  priority?: number;
  // For personal list
  user_id?: string;
  location_group?: string;
  // For group list
  group_id?: string;
}

export const savePlaceToList = async (params: SavePlaceParams): Promise<ApiResponse<Place | GroupPlace>> => {
  if (params.group_id) {
    // Save to group list
    return apiRequest<ApiResponse<GroupPlace>>(
      `/groups/${params.group_id}/places`,
      getFetchOptions('POST', {
        place_id: params.place_id,
        notes: params.notes
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