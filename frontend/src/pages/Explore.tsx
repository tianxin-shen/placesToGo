import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import SearchBar from '../components/SearchBar';
import { getPlaces } from '../api/places';
import { getPhotoUrl } from '../utils/photoUtils';
import type { Place, ApiResponse } from '../types/api';
import PlacesGrid from '../components/PlacesGrid';
import { savePlaceToList } from '../api/places';
import { getUserId } from '../utils/userUtils';
import { useGroup } from '../context/GroupContext';

export default function Explore() {
  const { data: apiResponse, isLoading, error } = useQuery<ApiResponse<Place[]>>({
    queryKey: ['places'],
    queryFn: async () => {
      const response = await getPlaces({ limit: 12 });
      return response;
    }
  });

  const { currentGroup } = useGroup();

  const handleSaveToWantToGo = async (placeId: string) => {
    try {
      if (currentGroup) {
        // Save to group list
        await savePlaceToList({
          place_id: placeId,
          group_id: currentGroup.id,
          type_group: 'tourist_attraction',
          year_group: new Date().getFullYear(),
          priority: 3
        });
      } else {
        // Save to personal list
        const userId = getUserId();
        await savePlaceToList({
          place_id: placeId,
          user_id: userId,
          priority: 3
        });
      }
    } catch (error) {
      console.error('Error saving place:', error);
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