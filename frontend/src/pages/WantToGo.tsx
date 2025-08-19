import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getWantToGoGroups, removeFromWantToGo } from '../api/wantToGo';
import { getGroupPlaces, removePlaceFromGroup } from '../api/groupPlaces';
import { getUserId, isAuthenticated } from '../utils/userUtils';
import { useGroup } from '../context/GroupContext';
import LocationGroup from '../components/LocationGroup';
import type { ApiResponse } from '../types/api';

export default function WantToGo() {
  const userId = getUserId();
  const isUserAuthenticated = isAuthenticated();
  const { currentGroup, setCurrentGroup } = useGroup();
  
  const { data: apiResponse, isLoading, error, refetch } = useQuery<ApiResponse<Record<string, any[]>>>({
    queryKey: ['places', currentGroup?.id || userId],
    queryFn: () => currentGroup 
      ? getGroupPlaces(currentGroup.id)
      : getWantToGoGroups({
          user_id: userId,
          groupBy: 'location'
        }),
    enabled: isUserAuthenticated
  });

  const handleRemoveFromWantToGo = async (placeId: string) => {
    try {
      if (currentGroup) {
        await removePlaceFromGroup(currentGroup.id, placeId);
      } else {
        await removeFromWantToGo(placeId, userId);
      }
      refetch();
    } catch (error) {
      console.error('Error removing place:', error);
    }
  };

  // Login prompt for anonymous users
  const LoginPrompt = () => {
    if (isUserAuthenticated) {
      return null; // Don't render anything if user is authenticated and popup is dismissed
    }
    
    return (
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6 relative">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-indigo-900">
              Save your places across devices
            </h3>
            <p className="text-indigo-700 mt-1">
              Sign in to access your want-to-go list on any device and sync your data.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isUserAuthenticated && (
              <Link
                to="/login"
                className="bg-white hover:bg-indigo-100 shadow-sm px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading places...</div>;
  }

  if (error) {
    console.error('Query error:', error);
    return <div className="container mx-auto px-4 py-8">Error loading places</div>;
  }

  if (!apiResponse?.data || Object.keys(apiResponse.data).length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoginPrompt />
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No places in your want to go list</h2>
          <p className="text-gray-600 mb-6">
            {isUserAuthenticated 
              ? "Start exploring places and add them to your list!"
              : "Start exploring places and add them to your list. Your data will be saved locally."
            }
          </p>
          <Link
            to="/"
            className="bg-white hover:bg-violet-100 shadow-sm px-6 py-3 rounded-md font-medium transition-colors"
          >
            Explore Places
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <LoginPrompt />
      
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {currentGroup ? `${currentGroup.name} - Places` : 'Want to Go'}
            </h1>
            <p className="text-gray-600">
              {currentGroup 
                ? "Places saved in this group"
                : isUserAuthenticated 
                  ? "Your saved places across all devices"
                  : "Your locally saved places"
              }
            </p>
          </div>
          {currentGroup && (
            <button
              onClick={() => setCurrentGroup(null)}
              className="text-sm text-violet-600 hover:text-violet-700 font-medium"
            >
              Switch to Personal List
            </button>
          )}
        </div>
      </div>

      {Object.entries(apiResponse.data).map(([locationName, places]) => {
        return (
          <LocationGroup
            key={locationName}
            locationName={locationName}
            places={places}
            onRemoveFromWantToGo={handleRemoveFromWantToGo}
          />
        );
      })}
    </div>
  );
} 