import { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import type { WantToGoPlace } from '../types/api';
import PlacesGrid from './PlacesGrid';

interface LocationGroupProps {
  locationName: string;
  places: WantToGoPlace[];
  onRemoveFromWantToGo: (placeId: string) => void;
}

const LocationGroup = ({ locationName, places, onRemoveFromWantToGo }: LocationGroupProps) => {
  console.log(`LocationGroup ${locationName} received places:`, places);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const maxPlaces = 6; // 2 rows of 3 places
  const displayedPlaces = isExpanded ? places : places.slice(0, maxPlaces);
  
  console.log(`LocationGroup ${locationName} displaying places:`, displayedPlaces);

  return (
    <div className="mb-8">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">{locationName}</h2>
          <span className="text-sm text-gray-500">({places.length} places)</span>
        </div>
        {places.length > maxPlaces && (
          <span className="text-gray-500">
            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </span>
        )}
      </button>
      
      <div className="mt-4">
        <PlacesGrid
          places={displayedPlaces}
          variant="wantToGo"
          onRemoveFromWantToGo={onRemoveFromWantToGo}
        />
      </div>
    </div>
  );
};

export default LocationGroup; 