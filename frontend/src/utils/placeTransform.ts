import type { PlacePreview } from '../types/api';
import type { GooglePlaceResponse } from '../types/google';
import { getPhotoUrlWithResolution } from './photoUtils';

export const transformGooglePlaceToPreview = (
  place: GooglePlaceResponse, 
  photoResolution: 'small' | 'medium' | 'large' | 'xlarge' = 'large'
): PlacePreview => {
  // Parse the formatted address to extract city, state, and country
  const addressParts = place.formattedAddress.split(',').map((part: string) => part.trim());
  const country = addressParts[addressParts.length - 1] || '';
  const state = addressParts[addressParts.length - 2] || '';
  const city = addressParts[addressParts.length - 3] || '';

  // Generate maps URLs
  const googleMapsUrl = `https://www.google.com/maps/place/?q=place_id:${place.id}`;
  const appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(place.displayName.text)}`;

  // Convert photo names to URLs with specified resolution
  const photoUrls = place.photos?.map((photo: any) => getPhotoUrlWithResolution(photo.name, photoResolution)) || [];

  return {
    name: place.displayName.text,
    location: {
      city,
      state,
      country
    },
    description: `${place.displayName.text} - ${place.formattedAddress}`,
    googleMapsUrl,
    appleMapsUrl,
    rating: place.rating,
    photoUrls,
    placeId: place.id
  };
}; 