import { apiRequest, getFetchOptions } from './client';
import type { Trip, CreateTripPayload } from '../types/api';

export const createTrip = (payload: CreateTripPayload): Promise<Trip> =>
  apiRequest<Trip>('/trips', getFetchOptions('POST', payload));

export const getTrips = (): Promise<Trip[]> =>
  apiRequest<Trip[]>('/trips', getFetchOptions('GET'));

export const getTrip = (id: string): Promise<Trip> =>
  apiRequest<Trip>(`/trips/${id}`, getFetchOptions('GET'));

export const updateTrip = (id: string, updates: Partial<Pick<Trip, 'preferences' | 'status' | 'itinerary'>>): Promise<Trip> =>
  apiRequest<Trip>(`/trips/${id}`, getFetchOptions('PUT', updates));

export const deleteTrip = (id: string): Promise<void> =>
  apiRequest<void>(`/trips/${id}`, getFetchOptions('DELETE'));
