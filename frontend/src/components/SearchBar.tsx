/// <reference types="@types/google.maps" />
import { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { getUserId } from '../utils/userUtils';
import type { PlacePreview, Photo, WantToGoPlace } from '../types/api';
import { addToWantToGo } from '../api/wantToGo';
import { getPhotoUrl, getPhotoUrlWithResolution } from '../utils/photoUtils';
import { getPlaceAutocomplete, getPlaceDetailsFromGoogle } from '../api/places';
import { useDebounce } from '../hooks/useDebounce';
import { FaPlus, FaTimes, FaSearch } from 'react-icons/fa';
import { transformGooglePlaceToPreview } from '../utils/placeTransform';
import { useNavigate } from 'react-router-dom';

// Initialize Google Maps loader
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Initialize Google Maps loader with additional options
const loader = new Loader({
  apiKey: GOOGLE_MAPS_API_KEY,
  version: 'beta',  // Required for new Places API
  libraries: ['places'],
  authReferrerPolicy: 'origin'
});

// Test the API key with a simple map load
const testApiKey = async () => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('Google Maps API key is not set in environment variables');
    return;
  }

  try {
    await loader.load();
    console.log('Maps API loaded successfully - API key is valid');
  } catch (error) {
    console.error('Error loading Maps API - API key might be invalid:', error);
  }
};

// Run the API key test
testApiKey();

// Add error handling for photo loading
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  console.error('Failed to load image:', e);
  const img = e.target as HTMLImageElement;
  img.style.display = 'none';
};

// Add interface for Google Places Photo
interface GooglePlacePhoto {
  name: string;
  widthPx: number;
  heightPx: number;
}

// Add interface for Google Place
interface GooglePlace {
  id: string;
  displayName: string;
  formattedAddress: string;
  rating?: number;
  photos?: GooglePlacePhoto[];
  addressComponents?: Array<{
    longText: string;
    types: string[];
  }>;
  fetchFields: (options: { fields: string[] }) => Promise<void>;
}

const parseGoogleMapsUrl = async (url: string): Promise<Partial<PlacePreview> | null> => {
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes('google.com')) return null;

    // Extract location name from the URL path
    const pathParts = urlObj.pathname.split('/');
    if (!pathParts.includes('place')) return null;

    // Find the place name part (comes after 'place' in the path)
    const placeIndex = pathParts.indexOf('place');
    const rawLocationName = pathParts[placeIndex + 1];
    
    // Clean up the location name - remove any additional path segments
    const cleanLocationName = rawLocationName.split('/')[0];
    const locationName = decodeURIComponent(cleanLocationName.replace(/\+/g, ' '));
    console.log('Searching for location:', locationName);

    // Extract coordinates from the URL - look for @ parameter in any part of the path
    let latitude, longitude;
    const coordsPart = pathParts.find(part => part.startsWith('@'));
    if (coordsPart) {
      const [lat, lng] = coordsPart.substring(1).split(',');
      latitude = parseFloat(lat);
      longitude = parseFloat(lng);
    }
    console.log('Coordinates:', latitude, longitude);

    try {
      // Load Google Maps API
      await loader.load();
      console.log('Maps API loaded successfully');
      
      const { Place } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
      console.log('Places library loaded successfully');

      // Search for the place using the new Place.searchByText
      console.log('Searching with query:', locationName);
      const searchResults = await Place.searchByText({
        textQuery: locationName,
        fields: ['id', 'displayName', 'formattedAddress', 'rating', 'photos', 'addressComponents'],
        language: 'en'
      });

      console.log('Search results:', searchResults);

      if (!searchResults.places || searchResults.places.length === 0) {
        throw new Error('Place not found');
      }

      const place = searchResults.places[0] as unknown as GooglePlace;
      
      // Get additional fields if needed
      await place.fetchFields({
        fields: ['addressComponents', 'rating', 'photos']
      });

      // Extract address components
      const addressComponents = place.addressComponents || [];
      const city = addressComponents.find(c => c.types.includes('locality'))?.longText || '';
      const state = addressComponents.find(c => c.types.includes('administrative_area_level_1'))?.longText || '';
      const country = addressComponents.find(c => c.types.includes('country'))?.longText || '';

      // Get photos if available
      let photoUrls: string[] = [];
      if (place.photos && place.photos.length > 0) {
        // Extract photo names and create URLs
        const photoNames = place.photos.map(photo => {
          if (typeof photo === 'string') return photo;
          const photoData = photo as unknown as GooglePlacePhoto;
          return photoData.name || '';
        }).filter(Boolean);

        console.log('Photo names:', photoNames);
        photoUrls = photoNames.map(name => getPhotoUrlWithResolution(name, 'large'));
      } else {
        console.log('No photos found');
      }

      return {
        name: place.displayName || locationName,
        location: {
          city,
          state,
          country,
        },
        description: place.formattedAddress || '',
        googleMapsUrl: url,
        appleMapsUrl: `https://maps.apple.com/?q=${encodeURIComponent(locationName)}&ll=${latitude},${longitude}`,
        rating: place.rating ?? undefined,
        photoUrls,
        placeId: place.id // Store the Google Places ID
      };
    } catch (error) {
      console.error('Error in Google Maps API operations:', error);
      throw error;  // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    console.error('Error parsing Google Maps URL:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return null;
  }
};

const parseInstagramUrl = (url: string): Partial<PlacePreview> | null => {
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes('instagram.com')) return null;

    // Extract location from the URL path
    const pathParts = urlObj.pathname.split('/');
    const locationTag = pathParts.find(part => part.startsWith('location-'));
    
    if (!locationTag) return null;

    const locationName = decodeURIComponent(locationTag.replace('location-', '').replace(/-/g, ' '));
    
    return {
      name: locationName,
      location: {
        city: locationName,
        state: '', // Will be filled by geocoding
        country: '', // Will be filled by geocoding
      },
      description: `Location from Instagram: ${locationName}`,
      googleMapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(locationName)}`,
      appleMapsUrl: `https://maps.apple.com/?q=${encodeURIComponent(locationName)}`
    };
  } catch {
    return null;
  }
};

const parseTikTokUrl = (url: string): Partial<PlacePreview> | null => {
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes('tiktok.com')) return null;

    // Extract location from the URL path or query parameters
    const pathParts = urlObj.pathname.split('/');
    const locationTag = pathParts.find(part => part.startsWith('location-'));
    
    if (!locationTag) return null;

    const locationName = decodeURIComponent(locationTag.replace('location-', '').replace(/-/g, ' '));
    
    return {
      name: locationName,
      location: {
        city: locationName,
        state: '', // Will be filled by geocoding
        country: '', // Will be filled by geocoding
      },
      description: `Location from TikTok: ${locationName}`,
      googleMapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(locationName)}`,
      appleMapsUrl: `https://maps.apple.com/?q=${encodeURIComponent(locationName)}`
    };
  } catch {
    return null;
  }
};

const searchByText = async (searchText: string): Promise<Partial<PlacePreview> | null> => {
  try {
    await loader.load();
    const { Place } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;

    console.log('Searching by text:', searchText);

    const searchResults = await Place.searchByText({
      textQuery: searchText,
      fields: ['id', 'displayName', 'formattedAddress', 'rating', 'photos', 'addressComponents']
    });

    if (!searchResults.places || searchResults.places.length === 0) {
      throw new Error('Place not found');
    }

    const place = searchResults.places[0] as unknown as GooglePlace;
    
    // Get additional fields
    await place.fetchFields({
      fields: ['addressComponents', 'rating', 'photos']
    });

    // Extract address components
    const addressComponents = place.addressComponents || [];
    const city = addressComponents.find(c => c.types.includes('locality'))?.longText || '';
    const state = addressComponents.find(c => c.types.includes('administrative_area_level_1'))?.longText || '';
    const country = addressComponents.find(c => c.types.includes('country'))?.longText || '';

    // Get photos if available
    let photoUrls: string[] = [];
    if (place.photos && place.photos.length > 0) {
      // Extract photo names and create URLs
      const photoNames = place.photos.map(photo => {
        if (typeof photo === 'string') return photo;
        const photoData = photo as unknown as GooglePlacePhoto;
        return photoData.name || '';
      }).filter(Boolean);

      console.log('Photo names:', photoNames);
      photoUrls = photoNames.map(name => getPhotoUrlWithResolution(name, 'large'));
    } else {
      console.log('No photos found');
    }

    return {
      name: place.displayName || searchText,
      location: {
        city,
        state,
        country,
      },
      description: place.formattedAddress || '',
      googleMapsUrl: `https://www.google.com/maps/place/${encodeURIComponent(place.displayName || searchText)}`,
      appleMapsUrl: `https://maps.apple.com/?q=${encodeURIComponent(place.displayName || searchText)}`,
      rating: place.rating ?? undefined,
      photoUrls,
      placeId: place.id // Store the Google Places ID
    };
  } catch (error) {
    console.error('Error searching by text:', error);
    return null;
  }
};

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({ onSearch, placeholder }: SearchBarProps) {
  const [searchInput, setSearchInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PlacePreview | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{
    placeId: string;
    mainText: string;
    secondaryText: string;
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debouncedSearchInput = useDebounce(searchInput, 300);

  // Handle clicks outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions when input changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedSearchInput.trim()) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await getPlaceAutocomplete(debouncedSearchInput);
        const newSuggestions = response.suggestions
          .filter(s => s.placePrediction)
          .map(s => ({
            placeId: s.placePrediction!.placeId,
            mainText: s.placePrediction!.structuredFormat.mainText.text,
            secondaryText: s.placePrediction!.structuredFormat.secondaryText.text
          }));
        setSuggestions(newSuggestions);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [debouncedSearchInput]);

  const handleSuggestionClick = async (placeId: string) => {
    setShowSuggestions(false);
    setSearchInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await getPlaceDetailsFromGoogle(placeId);
      if (!response.data) {
        throw new Error('No place details found');
      }

      const previewData = transformGooglePlaceToPreview(response.data);
      setPreviewData(previewData);
      setShowPreview(true);
    } catch (err) {
      setError('An error occurred while fetching place details. Please try again.');
      console.error('Error fetching place details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewData?.photoUrls?.length) {
      setCurrentPhotoIndex((prev) => (prev + 1) % previewData.photoUrls!.length);
    }
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewData?.photoUrls?.length) {
      setCurrentPhotoIndex((prev) => 
        prev === 0 ? previewData.photoUrls!.length - 1 : prev - 1
      );
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let locationData: Partial<PlacePreview> | null = null;

      // First, try to parse as URL
      try {
        const url = new URL(searchInput);
        if (url.hostname.includes('google.com')) {
          locationData = await parseGoogleMapsUrl(searchInput);
        }
      } catch {
        // Not a valid URL, will proceed with text search
      }

      // If no data from URL parsing, try text search
      if (!locationData) {
        locationData = await searchByText(searchInput);
      }

      if (!locationData) {
        setError('Could not find the location. Please try a different search term.');
        return;
      }

      setPreviewData(locationData as PlacePreview);
      setShowPreview(true);
    } catch (err) {
      setError('An error occurred while searching. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToWantToGo = async () => {
    if (!previewData) return;

    setIsSaving(true);
    try {
      const userId = getUserId();
      await addToWantToGo({
        place_id: previewData.placeId!, // Use the Google Places ID
        user_id: userId,
        location_group: previewData.location.city,
        type_group: previewData.types?.[0] || 'tourist_attraction',
        notes: previewData.description,
        priority: 3
      });
      setShowPreview(false);
      setSearchInput('');
    } catch (error) {
      console.error('Error adding to want to go:', error);
      setError('Failed to add place to want to go list. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setShowPreview(false);
    setSearchInput('');
  };

  // Reset photo index when new search results come in
  useEffect(() => {
    setCurrentPhotoIndex(0);
  }, [previewData?.photoUrls]);

  return (
    <div className="relative flex flex-col items-center">
      <form onSubmit={handleSearch} className="relative w-full flex justify-center">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setShowSuggestions(true);
          }}
          placeholder={placeholder || "Search for a place or paste a Google Maps URL"}
          className="w-2/3 p-4 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSuggestions([]);
            }}
            className="absolute mr-2 right-1/6 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </button>
        )}
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-2/3 mt-14 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion.placeId)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
            >
              <div className="font-medium">{suggestion.mainText}</div>
              <div className="text-sm text-gray-500">{suggestion.secondaryText}</div>
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-2 text-red-500 text-sm w-2/3">
          {error}
        </div>
      )}

      {showPreview && previewData && (
          <div className="mt-2 rounded-lg shadow-lg flex justify-center items-center w-2/3">
            <div className="max-w-xl p-4">
              {previewData.photoUrls && previewData.photoUrls.length > 0 && (
                <div className="w-full aspect-square relative mb-4 overflow-hidden rounded-lg group">
                  <img 
                    src={previewData.photoUrls[currentPhotoIndex]} 
                    alt={`${previewData.name} - Photo ${currentPhotoIndex + 1}`} 
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={handleImageError}
                  />
                  {previewData.photoUrls.length > 1 && (
                    <>
                      {/* Navigation arrows */}
                      <button 
                        onClick={handlePrevPhoto}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ◀
                      </button>
                      <button 
                        onClick={handleNextPhoto}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ▶
                      </button>
                      {/* Navigation dots */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                        {previewData.photoUrls.map((_, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentPhotoIndex(index);
                            }}
                            className={`w-0.5 h-1.5 rounded-full`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              <h3 className="text-lg font-semibold">{previewData.name}</h3>
              {previewData.rating && (
                <div className="flex items-center gap-1 text-yellow-500 mt-1">
                  <span>★</span>
                  <span className="text-gray-700">{previewData.rating}</span>
                </div>
              )}
              <p className="text-gray-600">
                {previewData.location.city}
                {previewData.location.state && `, ${previewData.location.state}`}
                {previewData.location.country && `, ${previewData.location.country}`}
              </p>
              <p className="mt-2 text-gray-700">{previewData.description}</p>
              
              <div className="mt-4 flex gap-2">
                <a
                  href={previewData.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google Maps
                </a>
                <span className="text-gray-300">|</span>
                <a
                  href={previewData.appleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Apple Maps
                </a>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleAddToWantToGo}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Adding...' : 'Add to Want to Go'}
                </button>
                <button
                  onClick={handleDiscard}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        
      )}
    </div>
  );
} 