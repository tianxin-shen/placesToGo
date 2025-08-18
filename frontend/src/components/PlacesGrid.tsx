import { useState, useEffect } from 'react';
import { FaRegHeart, FaHeart, FaWalking, FaCar, FaBus } from 'react-icons/fa';
import { getPhotoUrlWithResolution } from '../utils/photoUtils';
import type { Place, WantToGoPlace} from '../types/api';
import type { GooglePlaceResponse } from '../types/google';
import { useQuery } from '@tanstack/react-query';
import { getPlaceDetailsFromGoogle } from '../api/places';

interface PlacesGridProps {
  places: (Place | WantToGoPlace)[];
  variant?: 'explore' | 'wantToGo' | 'trip';
  onSaveToWantToGo?: (placeId: string) => void;
  onRemoveFromWantToGo?: (placeId: string) => void;
  isLoading?: boolean;
  error?: Error | null;
}

const PlacesGrid = ({
  places,
  variant = 'explore',
  onSaveToWantToGo,
  onRemoveFromWantToGo,
  isLoading: parentIsLoading,
  error: parentError
}: PlacesGridProps) => {
  // Fetch place details for WantToGoPlace objects that don't have place data
  const placeIds = places
    .filter((place): place is WantToGoPlace => 
      'status' in place && !('place' in place))
    .map(place => place.place_id);

  const { data: placeDetails, isLoading: isPlacesLoading } = useQuery({
    queryKey: ['placeDetails', placeIds],
    queryFn: async () => {
      const details = await Promise.all(
        placeIds.map(id => getPlaceDetailsFromGoogle(id))
      );
      return details.reduce((acc: Record<string, GooglePlaceResponse>, place) => {
        if (place.data) {
          acc[place.data.id] = place.data;
        }
        return acc;
      }, {});
    },
    enabled: placeIds.length > 0
  });

  const isLoading = parentIsLoading || isPlacesLoading;

  if (isLoading) {
    return <div>Loading places...</div>;
  }

  if (parentError) {
    console.error('Error loading places:', parentError);
    return <div>Error loading places</div>;
  }

  if (!places || places.length === 0) {
    return <div>No places found</div>;
  }

  const renderPriceLevel = (priceLevel?: number) => {
    if (!priceLevel) return null;
    return '💰'.repeat(priceLevel);
  };

  const renderOpeningHours = (openingHours?: Place['opening_hours']) => {
    if (!openingHours) return null;
    
    const today = new Date().getDay();
    const todayPeriod = openingHours.periods?.find(p => p.open.day === today);
    console.log("todayPeriod:", todayPeriod);
    
    if (!todayPeriod) return <span className="text-red-500">Closed today</span>;
    
    return (
      <div className="text-sm text-gray-600">
        <span>Open: {todayPeriod.open.time.slice(0, 2)}:{todayPeriod.open.time.slice(2)}</span>
        {todayPeriod.close && (
          <span> - {todayPeriod.close.time.slice(0, 2)}:{todayPeriod.close.time.slice(2)}</span>
        )}
      </div>
    );
  };

  const renderTransportationIcons = (place: Place) => {
    // This would typically come from the API, but for now we'll show all options
    return (
      <div className="flex gap-2 text-gray-500">
        <FaWalking className="w-4 h-4" title="Walking" />
        <FaCar className="w-4 h-4" title="Driving" />
        <FaBus className="w-4 h-4" title="Transit" />
      </div>
    );
  };

  const renderPlaceCard = (place: Place | WantToGoPlace) => {
    const isWantToGoPlace = 'status' in place;
    let placeData: Place | undefined;
    console.log('render place card with place data:', place);
    console.log('isWantToGoPlace:', isWantToGoPlace);

    if (isWantToGoPlace) {
      console.log("placeDetails:", placeDetails, "place.place_id:", place.place_id);
      // If it's a WantToGoPlace with place data, use that
      if ('place' in place && place.place) {
        console.log("placeData = place.place")
        placeData = place.place;
      } 
      // If it's a WantToGoPlace without place data, fetch it from our loaded details
      else if (placeDetails) {

        const details = placeDetails[place.place_id];
        if (details && details.id === place.place_id) {
          console.log("placeData = details")
          placeData = {
            place_id: details.id,
            name: details.displayName.text,
            formatted_address: details.formattedAddress,
            description: '',
            location: { lat: 0, lng: 0 },
            maps: { google: '', apple: '' },
            rating: details.rating,
            user_ratings_total: details.userRatingCount,
            photos: details.photos?.map(p => ({
              name: p.name,
              widthPx: p.widthPx,
              heightPx: p.heightPx
            })) || [],
            types: [],
            tags: [],
            price_level: details.priceLevel === 'PRICE_LEVEL_MODERATE' ? 2 : 
                        details.priceLevel === 'PRICE_LEVEL_EXPENSIVE' ? 3 :
                        details.priceLevel === 'PRICE_LEVEL_VERY_EXPENSIVE' ? 4 : 1,
            opening_hours: details.regularOpeningHours ? {
              open_now: details.regularOpeningHours.openNow,
              periods: details.regularOpeningHours.periods.map(p => ({
                open: { day: p.open.day, time: `${p.open.hour}${p.open.minute}` },
                close: { day: p.close.day, time: `${p.close.hour}${p.close.minute}` }
              })),
              weekday_text: details.regularOpeningHours.weekdayDescriptions
            } : undefined
          };
        }
      }
    } else {
      console.log("placeData = place")
      placeData = place;
    }

    if (!placeData) {
      console.log('No place data available for:', place);
      return null;
    }

    return (
      <div key={placeData.place_id} className="bg-white rounded-lg shadow-md overflow-hidden">
        {placeData.photos && placeData.photos.length > 0 && (
          <img
            src={getPhotoUrlWithResolution(placeData.photos[0].name)}
            alt={placeData.name}
            className="w-full h-48 object-cover rounded-lg mb-4"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
            }}
          />
        )}
        <div className="p-4">
          <h3 className="text-xl font-semibold mb-2">{placeData.name}</h3>
          <p className="text-gray-600 mb-2">{placeData.formatted_address}</p>
          <p className="text-gray-700 mb-4">{placeData.description}</p>
          
          {/* Additional information based on variant */}
          {variant === 'wantToGo' && (
            <>
              {renderOpeningHours(placeData.opening_hours)}
              <div className="mt-2">
                {renderPriceLevel(placeData.price_level)}
              </div>
              <div className="mt-2">
                {renderTransportationIcons(placeData)}
              </div>
            </>
          )}

          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-4">
              {placeData.rating && (
                <div className="flex items-center">
                  <span className="text-yellow-500">★</span>
                  <span className="ml-1">{placeData.rating}</span>
                </div>
              )}
              {variant === 'wantToGo' && isWantToGoPlace && (
                <span className="text-sm text-gray-500">
                  {place.location_group && `📍 ${place.location_group}`}
                </span>
              )}
            </div>
            
            {/* Action buttons based on variant */}
            {variant === 'explore' && onSaveToWantToGo && (
              <button
                onClick={() => onSaveToWantToGo(placeData.place_id)}
                className="text-red-500 hover:text-red-600"
              >
                <FaRegHeart className="w-6 h-6" />
              </button>
            )}
            {variant === 'wantToGo' && onRemoveFromWantToGo && (
              <button
                onClick={() => onRemoveFromWantToGo(placeData.place_id)}
                className="text-red-500 hover:text-red-600"
              >
                <FaHeart className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {places.map(renderPlaceCard)}
    </div>
  );
};

export default PlacesGrid; 