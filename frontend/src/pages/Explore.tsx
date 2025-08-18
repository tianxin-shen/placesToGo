import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import SearchBar from '../components/SearchBar';
import { getPlaces } from '../api/places';
import { getPhotoUrl } from '../utils/photoUtils';
import type { Place, ApiResponse } from '../types/api';
import PlacesGrid from '../components/PlacesGrid';
import { addToWantToGo } from '../api/wantToGo';
import { getUserId } from '../utils/userUtils';

export default function Explore() {
  const { data: apiResponse, isLoading, error } = useQuery<ApiResponse<Place[]>>({
    queryKey: ['places'],
    queryFn: async () => {
      const response = await getPlaces({ limit: 12 });
      return response;
    }
  });

  const handleSaveToWantToGo = async (placeId: string) => {
    try {
      const userId = getUserId();
      await addToWantToGo({
        place_id: placeId,
        user_id: userId,
        priority: 3
      });
    } catch (error) {
      console.error('Error saving to want to go:', error);
    }
  };

  return (
    <div className="container mx-auto">
      <div className='mb-4 mt-4'>
        <SearchBar />
      </div>
        <PlacesGrid
          places={apiResponse?.data || []}
          variant="explore"
          onSaveToWantToGo={handleSaveToWantToGo}
          isLoading={isLoading}
          error={error as Error}
        />
    </div>
  );
} 