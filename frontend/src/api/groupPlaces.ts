import { apiRequest, getFetchOptions } from './client';
import type { GroupPlace, ApiResponse } from '../types/api';

interface GroupPlacesResponse {
  data: Record<string, GroupPlace[]>;
}

export const getGroupPlaces = async (groupId: string, groupBy: 'location' | 'date' = 'location'): Promise<ApiResponse<Record<string, GroupPlace[]>>> => {
  return apiRequest<ApiResponse<Record<string, GroupPlace[]>>>(
    `/groups/${groupId}/places?groupBy=${groupBy}`,
    getFetchOptions('GET')
  );
};

export const addPlaceToGroup = async (groupId: string, placeId: string, notes?: string): Promise<ApiResponse<GroupPlace>> => {
  return apiRequest<ApiResponse<GroupPlace>>(
    `/groups/${groupId}/places`,
    getFetchOptions('POST', { place_id: placeId, notes })
  );
};

export const removePlaceFromGroup = async (groupId: string, placeId: string): Promise<ApiResponse<void>> => {
  return apiRequest<ApiResponse<void>>(
    `/groups/${groupId}/places/${placeId}`,
    getFetchOptions('DELETE')
  );
};
