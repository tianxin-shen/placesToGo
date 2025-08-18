import { useAuth } from '../context/AuthContext';

// Storage keys
const ANONYMOUS_USER_ID_KEY = 'anonymous_user_id';
const ANONYMOUS_WANT_TO_GO_KEY = 'anonymous_want_to_go';
const OLD_USER_ID_KEY = 'userId'; // Old key to clean up

// Generate a random user ID for anonymous users
const generateAnonymousUserId = (): string => {
  return 'guest_' + Math.random().toString(36).substring(2, 15);
};

// Clean up old storage keys
const cleanupOldStorage = () => {
  // Remove old userId key if it exists
  if (localStorage.getItem(OLD_USER_ID_KEY)) {
    console.log('Cleaning up old userId storage key');
    localStorage.removeItem(OLD_USER_ID_KEY);
  }
};

// Migrate old storage data if needed
const migrateOldStorage = () => {
  // Check if there's old want-to-go data that needs migration
  const oldWantToGoKey = 'want_to_go'; // Old key name
  const oldData = localStorage.getItem(oldWantToGoKey);
  
  if (oldData) {
    try {
      console.log('Migrating old want-to-go data...');
      const parsedData = JSON.parse(oldData);
      
      // If it's an array of places, migrate it
      if (Array.isArray(parsedData)) {
        localStorage.setItem(ANONYMOUS_WANT_TO_GO_KEY, oldData);
        console.log('Successfully migrated old want-to-go data');
      }
      
      // Remove old data
      localStorage.removeItem(oldWantToGoKey);
    } catch (error) {
      console.error('Error migrating old want-to-go data:', error);
      localStorage.removeItem(oldWantToGoKey);
    }
  }
};

// Get or create anonymous user ID from localStorage
export const getAnonymousUserId = (): string => {
  // Clean up old storage first
  cleanupOldStorage();
  migrateOldStorage();
  
  const storedUserId = localStorage.getItem(ANONYMOUS_USER_ID_KEY);
  if (storedUserId) {
    return storedUserId;
  }
  
  const newUserId = generateAnonymousUserId();
  localStorage.setItem(ANONYMOUS_USER_ID_KEY, newUserId);
  return newUserId;
};

// Get the appropriate user ID (authenticated or anonymous)
export const getUserId = (): string => {
  // Clean up old storage first
  cleanupOldStorage();
  migrateOldStorage();
  
  // Check if user is authenticated
  const authTokens = localStorage.getItem('access_token');
  if (authTokens) {
    // User is authenticated, get their real user ID
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.id) {
          return user.id;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear invalid user data
        localStorage.removeItem('user');
      }
    }
  }
  
  // User is anonymous, use anonymous ID
  return getAnonymousUserId();
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('access_token');
};

// Get anonymous want-to-go places from localStorage
export const getAnonymousWantToGoPlaces = (): any[] => {
  try {
    return JSON.parse(localStorage.getItem(ANONYMOUS_WANT_TO_GO_KEY) || '[]');
  } catch (error) {
    console.error('Error parsing anonymous want-to-go places:', error);
    // Clear invalid data and return empty array
    localStorage.removeItem(ANONYMOUS_WANT_TO_GO_KEY);
    return [];
  }
};

// Save want-to-go place for anonymous user
export const saveAnonymousWantToGoPlace = (place: any) => {
  const places = getAnonymousWantToGoPlaces();
  places.push(place);
  localStorage.setItem(ANONYMOUS_WANT_TO_GO_KEY, JSON.stringify(places));
};

// Remove want-to-go place for anonymous user
export const removeAnonymousWantToGoPlace = (placeId: string) => {
  const places = getAnonymousWantToGoPlaces();
  const filteredPlaces = places.filter(place => place.place_id !== placeId);
  localStorage.setItem(ANONYMOUS_WANT_TO_GO_KEY, JSON.stringify(filteredPlaces));
};

// Clear anonymous data after successful migration
export const clearAnonymousData = () => {
  localStorage.removeItem(ANONYMOUS_USER_ID_KEY);
  localStorage.removeItem(ANONYMOUS_WANT_TO_GO_KEY);
  // Also clean up old keys
  localStorage.removeItem(OLD_USER_ID_KEY);
};

// Get anonymous data for migration
export const getAnonymousDataForMigration = () => {
  const anonymousUserId = getAnonymousUserId();
  const places = getAnonymousWantToGoPlaces();
  
  return {
    anonymousUserId,
    places,
    hasData: places.length > 0
  };
}; 