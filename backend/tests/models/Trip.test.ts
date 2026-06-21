import Trip, { ITrip } from '../../src/models/Trip';
import TripDay from '../../src/models/TripDay';
import TripPlace from '../../src/models/TripPlace';
import User from '../../src/models/User';
import Group from '../../src/models/Group';
import GroupMember from '../../src/models/GroupMember';
import WantToGo from '../../src/models/WantToGo';
import Place from '../../src/models/Place';

describe('Trip Model', () => {
  let testUser: any;
  let testGroup: any;
  let testPlace: any;
  let testWantToGo: any;

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      name: 'Test User',
      authMethods: {
        email: {
          email: 'test@example.com',
          password: 'hashedpassword',
          verified: true
        }
      },
      status: 'active'
    });

    // Create test group
    testGroup = await Group.create({
      name: 'Test Group',
      shareCode: 'TEST123',
      status: 'active'
    });

    // Add user to group as owner
    await GroupMember.create({
      group_id: testGroup._id,
      user_id: testUser._id,
      role: 'owner',
      status: 'active'
    });

    // Create test place
    testPlace = await Place.create({
      place_id: 'test_place_123',
      name: 'Test Place',
      formatted_address: '123 Test St',
      location: { lat: 37.7749, lng: -122.4194 },
      maps: {
        google: 'https://maps.google.com',
        apple: 'https://maps.apple.com'
      },
      rating: 4.5,
      types: ['restaurant'],
      description: 'A test place'
    });

    // Create test WantToGo entry
    testWantToGo = await WantToGo.create({
      place_id: 'test_place_123',
      user_id: testUser._id.toString(),
      saved_at: new Date(),
      location_group: 'Test City',
      type_group: 'restaurant',
      status: 'pending'
    });
  });

  describe('Trip Creation and Validation', () => {
    it('should create a valid personal trip', async () => {
      // Test: Creating a personal trip with valid data
      const tripData = {
        title: 'Personal SF Trip',
        creator: testUser._id,
        destinations: [{
          name: 'San Francisco',
          location: { lat: 37.7749, lng: -122.4194 },
          order: 1
        }],
        durationDays: 3,
        preferences: {
          pace: 'moderate' as const,
          interests: ['food', 'attractions'],
          budget: 'moderate' as const,
          transport: 'walking' as const
        },
        sourcePlaces: [{
          placeId: testPlace._id,
          savedPlaceId: testWantToGo._id,
          savedPlaceType: 'personal' as const
        }],
        status: 'planning' as const
      };

      const trip = await Trip.create(tripData);

      expect(trip.title).toBe('Personal SF Trip');
      expect(trip.creator.toString()).toBe(testUser._id.toString());
      expect(trip.destinations).toHaveLength(1);
      expect(trip.sourcePlaces).toHaveLength(1);
      expect(trip.status).toBe('planning');
    });

    it('should create a valid group trip and populate editors', async () => {
      // Test: Group trip creation with automatic editors population
      const tripData = {
        title: 'Group SF Trip',
        creator: testUser._id,
        group: testGroup._id,
        destinations: [{
          name: 'San Francisco',
          location: { lat: 37.7749, lng: -122.4194 },
          order: 1
        }],
        durationDays: 3,
        preferences: {
          pace: 'moderate' as const,
          interests: ['food', 'attractions'],
          budget: 'moderate' as const,
          transport: 'walking' as const
        },
        sourcePlaces: [{
          placeId: testPlace._id,
          savedPlaceId: testWantToGo._id,
          savedPlaceType: 'personal' as const
        }],
        status: 'planning' as const
      };

      const trip = await Trip.create(tripData);

      expect(trip.title).toBe('Group SF Trip');
      expect(trip.group?.toString()).toBe(testGroup._id.toString());
      expect(trip.editors).toContain(testUser._id.toString()); // Should auto-populate
    });

    it('should reject trip with invalid source place reference', async () => {
      // Test: Validation middleware prevents invalid saved place references
      const invalidTripData = {
        title: 'Invalid Trip',
        creator: testUser._id,
        destinations: [{
          name: 'San Francisco',
          location: { lat: 37.7749, lng: -122.4194 },
          order: 1
        }],
        durationDays: 3,
        preferences: {
          pace: 'moderate' as const,
          interests: ['food'],
          budget: 'moderate' as const,
          transport: 'walking' as const
        },
        sourcePlaces: [{
          placeId: testPlace._id,
          savedPlaceId: 'nonexistent_wantToGo_id', // Invalid reference
          savedPlaceType: 'personal' as const
        }],
        status: 'planning' as const
      };

      await expect(Trip.create(invalidTripData)).rejects.toThrow('Invalid saved place reference');
    });

    it('should enforce required fields', async () => {
      // Test: Validation requires essential fields
      const invalidTripData = {
        title: 'Incomplete Trip'
        // Missing creator, destinations, durationDays, etc.
      };

      await expect(Trip.create(invalidTripData)).rejects.toThrow();
    });
  });

  describe('Trip Statistics and Updates', () => {
    let testTrip: ITrip;

    beforeEach(async () => {
      testTrip = await Trip.create({
        title: 'Test Trip',
        creator: testUser._id,
        destinations: [{
          name: 'Test City',
          location: { lat: 37.7749, lng: -122.4194 },
          order: 1
        }],
        durationDays: 3,
        preferences: {
          pace: 'moderate' as const,
          interests: ['food'],
          budget: 'moderate' as const,
          transport: 'walking' as const
        },
        sourcePlaces: [{
          placeId: testPlace._id,
          savedPlaceId: testWantToGo._id,
          savedPlaceType: 'personal' as const
        }],
        status: 'planning' as const,
        totalPlaces: 1,
        estimatedDuration: 180
      });
    });

    it('should update trip status correctly', async () => {
      // Test: Status updates work properly
      await Trip.findByIdAndUpdate(testTrip._id, { status: 'confirmed' });

      const updatedTrip = await Trip.findById(testTrip._id);
      expect(updatedTrip?.status).toBe('confirmed');
    });

    it('should update trip preferences', async () => {
      // Test: Preferences can be updated
      const newPreferences = {
        pace: 'intense' as const,
        interests: ['food', 'adventure'],
        budget: 'luxury' as const,
        transport: 'driving' as const
      };

      await Trip.findByIdAndUpdate(testTrip._id, {
        preferences: newPreferences
      });

      const updatedTrip = await Trip.findById(testTrip._id);
      expect(updatedTrip?.preferences.pace).toBe('intense');
      expect(updatedTrip?.preferences.interests).toContain('adventure');
    });
  });

  describe('Database Indexes', () => {
    it('should have proper indexes for query performance', async () => {
      // Test: Verify indexes exist for common queries
      const collection = Trip.collection;
      const indexes = await collection.indexes();

      // Should have compound indexes for common queries
      const indexNames = indexes.map((idx: any) => idx.name);

      expect(indexNames.some(name => name.includes('creator') && name.includes('status'))).toBe(true);
      expect(indexNames.some(name => name.includes('group') && name.includes('status'))).toBe(true);
      expect(indexNames.some(name => name.includes('editors'))).toBe(true);
    });
  });
});
