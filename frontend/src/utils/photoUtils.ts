import React, { useState, useEffect } from 'react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Photo resolution presets
export const PHOTO_RESOLUTIONS = {
  thumbnail: { maxWidth: 150, maxHeight: 150 },
  small: { maxWidth: 400, maxHeight: 400 },
  medium: { maxWidth: 800, maxHeight: 800 },
  large: { maxWidth: 1200, maxHeight: 1200 },
  xlarge: { maxWidth: 1920, maxHeight: 1920 },
  original: { maxWidth: 4000, maxHeight: 4000 } // Maximum supported by Google Places API
} as const;

export type PhotoResolution = keyof typeof PHOTO_RESOLUTIONS;

// Function to get photo URL from photo name with custom dimensions
export const getPhotoUrl = (
  photoName: string, 
  maxWidth: number = 400, 
  maxHeight: number = 400
): string => {
  // Ensure we're using the new Places API format
  const cleanPhotoName = photoName.includes('photos/') ? photoName : `photos/${photoName}`;
  return `https://places.googleapis.com/v1/${cleanPhotoName}/media?key=${GOOGLE_MAPS_API_KEY}&maxWidthPx=${maxWidth}&maxHeightPx=${maxHeight}`;
};

// Convenience function to get photo URL with preset resolutions
export const getPhotoUrlWithResolution = (
  photoName: string, 
  resolution: PhotoResolution = 'medium'
): string => {
  const { maxWidth, maxHeight } = PHOTO_RESOLUTIONS[resolution];
  return getPhotoUrl(photoName, maxWidth, maxHeight);
};

// Function to get multiple photo URLs with different resolutions
export const getPhotoUrlsWithResolutions = (
  photoName: string,
  resolutions: PhotoResolution[] = ['small', 'medium', 'large']
): Record<PhotoResolution, string> => {
  const urls: Record<PhotoResolution, string> = {} as Record<PhotoResolution, string>;
  
  resolutions.forEach(resolution => {
    urls[resolution] = getPhotoUrlWithResolution(photoName, resolution);
  });
  
  return urls;
};

// Function to get the best photo URL for a given container size
export const getPhotoUrlForContainer = (
  photoName: string,
  containerWidth: number,
  containerHeight: number,
  devicePixelRatio: number = window.devicePixelRatio || 1
): string => {
  // Calculate the required resolution accounting for device pixel ratio
  const requiredWidth = Math.ceil(containerWidth * devicePixelRatio);
  const requiredHeight = Math.ceil(containerHeight * devicePixelRatio);
  
  // Find the best resolution that covers our requirements
  const resolutions = Object.entries(PHOTO_RESOLUTIONS);
  const bestResolution = resolutions.find(([_, { maxWidth, maxHeight }]) => 
    maxWidth >= requiredWidth && maxHeight >= requiredHeight
  );
  
  if (bestResolution) {
    return getPhotoUrlWithResolution(photoName, bestResolution[0] as PhotoResolution);
  }
  
  // Fallback to original resolution if no preset covers our needs
  return getPhotoUrl(photoName, requiredWidth, requiredHeight);
};

// React hook for responsive photos (if you're using React)
export const useResponsivePhoto = (
  photoName: string,
  containerRef: React.RefObject<HTMLElement>,
  defaultResolution: PhotoResolution = 'medium'
) => {
  const [photoUrl, setPhotoUrl] = useState<string>('');
  
  useEffect(() => {
    if (!containerRef.current || !photoName) return;
    
    const updatePhotoUrl = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const url = getPhotoUrlForContainer(photoName, rect.width, rect.height);
      setPhotoUrl(url);
    };
    
    updatePhotoUrl();
    
    // Update on resize
    const resizeObserver = new ResizeObserver(updatePhotoUrl);
    resizeObserver.observe(containerRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [photoName, containerRef]);
  
  return photoUrl || getPhotoUrlWithResolution(photoName, defaultResolution);
}; 