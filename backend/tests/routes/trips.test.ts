import request from 'supertest';
import app from '../../src/app';
import Trip from '../../src/models/Trip';
import TripDay from '../../src/models/TripDay';
import TripPlace from '../../src/models/TripPlace';
import TripActivity from '../../src/models/TripActivity';
import User from '../../src/models/User';
import Group from '../../src/models/Group';
import GroupMember from '../../src/models/GroupMember';
import WantToGo from '../../src/models/WantToGo';
import GroupPlace from '../../src/models/GroupPlace';
import Place from '../../src/models/Place';
import jwt from 'jsonwebtoken';

describe('Trip Routes', () => {
  let testUser: any;
  let testGroup: any;
  let testPlace: any;
  let testWantToGo: any;
  let testGroupPlace: any;
  let userToken: string;

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

    // Create JWT token for authentication
    userToken = jwt.sign(
      { id: testUser._id.toString(), email: testUser.email },
      process.env.JWT_SECRET || 'test-jwt-secret'
    );

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
      name: 'Golden Gate Bridge',
      formatted_address: 'Golden Gate Bridge, San Francisco, CA',
      location: { lat: 37.8199, lng: -122.4783 },
      maps: {
        google: 'https://maps.google.com',
        apple: 'https://maps.apple.com'
      },
      rating: 4.5,
      types: ['tourist_attraction'],
      description: 'Iconic suspension bridge'
    });

    // Create personal WantToGo entry
    testWantToGo = await WantToGo.create({
      place_id: 'test_place_123',
      user_id: testUser._id.toString(),
      saved_at: new Date(),
      location_group: 'San Francisco',
      type_group: 'tourist_attraction',
      status: 'pending'
    });

    // Create group GroupPlace entry
    testGroupPlace = await GroupPlace.create({
      group_id: testGroup._id,
      place_id: 'test_place_456',
      added_by: testUser._id,
      location_group: 'San Francisco',
      type_group: 'restaurant',
      status: 'pending'
    });

    // Create the place for group place
    await Place.create({
      place_id: 'test_place_456',
      name: 'Test Restaurant',
      formatted_address: '123 Restaurant St, San Francisco',
      location: { lat: 37.7749, lng: -122.4194 },
      maps: {
        google: 'https://maps.google.com',
        apple: 'https://maps.apple.com'
      },
      rating: 4.2,
      types: ['restaurant'],
      description: 'A test restaurant'
    });
  });

  describe('POST /api/trips/generate', () => {
    it('should generate a personal trip successfully', async () => {
      // Test: Generate personal trip from saved places
      const tripData = {
        destinations: [{
          name: 'San Francisco',
          location: { lat: 37.7749, lng: -122.4194 },
          order: 1
        }],
        durationDays: 3,
        sourcePlaces: [{
          savedPlaceId: testWantToGo._id.toString(),
          savedPlaceType: 'personal'
        }],
        preferences: {
          pace: 'moderate',
          interests: ['food', 'attractions'],
          budget: 'moderate',
          transport: 'walking'
        }
      };

      const response = await request(app)
        .post('/api/trips/generate')
        .set('Authorization', `Bearer ${userToken}`)
        .send(tripData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Trip generated successfully');
      expect(response.body.trip.title).toContain('San Francisco');
      expect(response.body.trip.creator).toBe(testUser._id.toString());

      // Verify trip was created in database
      const trip = await Trip.findById(response.body.trip._id);
      expect(trip).toBeTruthy();
      expect(trip?.sourcePlaces).toHaveLength(1);

      // Verify trip days were created
      const days = await TripDay.find({ trip: trip?._id });
      expect(days).toHaveLength(3); // 3 days as specified

      // Verify trip places were created
      const places = await TripPlace.find({ trip: trip?._id });
      expect(places.length).toBeGreaterThan(0);
    });

    it('should generate a group trip with editors populated', async () => {
      // Test: Generate group trip with automatic editor population
      const tripData = {
        destinations: [{
          name: 'San Francisco',
          location: { lat: 37.7749, lng: -122.4194 },
          order: 1
        }],
        durationDays: 2,
        sourcePlaces: [{
          savedPlaceId: testWantToGo._id.toString(),
          savedPlaceType: 'personal'
        }],
        groupId: testGroup._id.toString(),
        preferences: {
          pace: 'relaxed',
          interests: ['attractions'],
          budget: 'moderate',
          transport: 'public'
        }
      };

      const response = await request(app)
        .post('/api/trips/generate')
        .set('Authorization', `Bearer ${userToken}`)
        .send(tripData);

      expect(response.status).toBe(201);
      expect(response.body.trip.group).toBe(testGroup._id.toString());
      expect(response.body.trip.editors).toContain(testUser._id.toString());
    });

    it('should reject trip generation without authentication', async () => {
      // Test: Authentication required for trip generation
      const tripData = {
        destinations: [{
          name: 'San Francisco',
          location: { lat: 37.7749, lng: -122.4194 },
          order: 1
        }],
        durationDays: 3,
        sourcePlaces: [{
          savedPlaceId: testWantToGo._id.toString(),
          savedPlaceType: 'personal'
        }]
      };

      const response = await request(app)
        .post('/api/trips/generate')
        .send(tripData);

      expect(response.status).toBe(401);
    });

    it('should reject invalid trip data', async () => {
      // Test: Validation catches invalid input
      const invalidTripData = {
        destinations: [], // Empty destinations
        durationDays: 50, // Exceeds max limit
        sourcePlaces: []
      };

      const response = await request(app)
        .post('/api/trips/generate')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidTripData);

      expect(response.status).toBe(400);
    });

    it('should reject group trip for non-member', async () => {
      // Test: User must be group member to create group trip
      const otherUser = await User.create({
        email: 'other@example.com',
        name: 'Other User',
        authMethods: {
          email: {
            email: 'other@example.com',
            password: 'hashedpassword',
            verified: true
          }
        },
        status: 'active'
      });

      const otherToken = jwt.sign(
        { id: otherUser._id.toString(), email: otherUser.email },
        process.env.JWT_SECRET || 'test-jwt-secret'
      );

      const tripData = {
        destinations: [{
          name: 'San Francisco',
          location: { lat: 37.7749, lng: -122.4194 },
          order: 1
        }],
        durationDays: 3,
        sourcePlaces: [{
          savedPlaceId: testWantToGo._id.toString(),
          savedPlaceType: 'personal'
        }],
        groupId: testGroup._id.toString() // User is not a member
      };

      const response = await request(app)
        .post('/api/trips/generate')
        .set('Authorization', `Bearer ${otherToken}`)
        .send(tripData);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Not authorized');
    });

    it('should log trip creation activity', async () => {
      // Test: Trip creation is logged in activity feed
      const tripData = {
        destinations: [{
          name: 'San Francisco',
          location: { lat: 37.7749, lng: -122.4194 },
          order: 1
        }],
        durationDays: 2,
        sourcePlaces: [{
          savedPlaceId: testWantToGo._id.toString(),
          savedPlaceType: 'personal'
        }],
        preferences: {
          pace: 'moderate',
          interests: ['attractions'],
          budget: 'moderate',
          transport: 'walking'
        }
      };

      const response = await request(app)
        .post('/api/trips/generate')
        .set('Authorization', `Bearer ${userToken}`)
        .send(tripData);

      expect(response.status).toBe(201);

      // Verify activity was logged
      const activities = await TripActivity.find({
        trip: response.body.trip._id,
        type: 'trip_created'
      });

      expect(activities).toHaveLength(1);
      expect(activities[0].description).toContain('Created trip');
    });
  });

  describe('GET /api/trips', () => {
    let personalTrip: any;
    let groupTrip: any;

    beforeEach(async () => {
      // Create test trips
      personalTrip = await Trip.create({
        title: 'Personal Trip',
        creator: testUser._id,
        destinations: [{
          name: 'SF',
          location: { lat: 37.7749, lng: -122.4194 },
          order: 1
        }],
        durationDays: 2,
        preferences: {
          pace: 'moderate',
          interests: ['food'],
          budget: 'moderate',
          transport: 'walking'
        },
        sourcePlaces: [{
          placeId: testPlace._id,
          savedPlaceId: testWantToGo._id,
          savedPlaceType: 'personal'
        }],
        status: 'planning'
      });

      groupTrip = await Trip.create({
        title: 'Group Trip',
        creator: testUser._id,
        group: testGroup._id,
        editors: [testUser._id.toString()],
        destinations: [{
          name: 'SF',
          location: { lat: 37.7749, lng: -122.4194 },
          order: 1
        }],
        durationDays: 2,
        preferences: {
          pace: 'moderate',
          interests: ['food'],
          budget: 'moderate',
          transport: 'walking'
        },
        sourcePlaces: [{
          placeId: testPlace._id,
          savedPlaceId: testWantToGo._id,
          savedPlaceType: 'personal'
        }],
        status: 'confirmed'
      });
    });

    it('should list user\'s trips', async () => {
      // Test: Get all trips for authenticated user
      const response = await request(app)
        .get('/api/trips')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2); // Both trips

      // Verify trip data structure
      const tripTitles = response.body.map((trip: any) => trip.title);
      expect(tripTitles).toContain('Personal Trip');
      expect(tripTitles).toContain('Group Trip');
    });

    it('should filter trips by status', async () => {
      // Test: Filter trips by status
      const response = await request(app)
        .get('/api/trips?status=confirmed')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].title).toBe('Group Trip');
    });

    it('should filter trips by group', async () => {
      // Test: Filter trips by group
      const response = await request(app)
        .get(`/api/trips?groupId=${testGroup._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].title).toBe('Group Trip');
    });

    it('should support pagination', async () => {
      // Test: Pagination works correctly
      const response = await request(app)
        .get('/api/trips?limit=1&offset=1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1); // Should return second trip
    });

    it('should exclude sourcePlaces for performance', async () => {
      // Test: List view excludes heavy sourcePlaces data
      const response = await request(app)
        .get('/api/trips')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body[0].sourcePlaces).toBeUndefined();
    });
  });

  describe('GET /api/trips/:id', () => {
    let testTrip: any;

    beforeEach(async () => {
      testTrip = await Trip.create({
        title: 'Test Trip Details',
        creator: testUser._id,
        destinations: [{
          name: 'SF',
          location: { lat: 37.7749, lng: -122.4194 },
          order: 1
        }],
        durationDays: 2,
        preferences: {
          pace: 'moderate',
          interests: ['food'],
          budget: 'moderate',
          transport: 'walking'
        },
        sourcePlaces: [{
          placeId: testPlace._id,
          savedPlaceId: testWantToGo._id,
          savedPlaceType: 'personal'
        }],
        status: 'planning'
      });

      // Create trip days and places
      const day1 = await TripDay.create({
        trip: testTrip._id,
        dayNumber: 1,
        title: 'Day 1',
        focus: 'attractions'
      });

      const day2 = await TripDay.create({
        trip: testTrip._id,
        dayNumber: 2,
        title: 'Day 2',
        focus: 'food'
      });

      await TripPlace.create({
        trip: testTrip._id,
        tripDay: day1._id,
        place: testPlace._id,
        order: 1,
        estimatedDuration: 120,
        priority: 'high',
        status: 'planned',
        placeSnapshot: {
          place_id: testPlace.place_id,
          name: testPlace.name,
          formatted_address: testPlace.formatted_address,
          location: testPlace.location,
          rating: testPlace.rating,
          types: testPlace.types
        }
      });
    });

    it('should return complete trip details', async () => {
      // Test: Get full trip details with days and places
      const response = await request(app)
        .get(`/api/trips/${testTrip._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.trip.title).toBe('Test Trip Details');
      expect(response.body.days).toHaveLength(2);
      expect(response.body.places).toHaveLength(1);
      expect(response.body.days[0].title).toBe('Day 1');
      expect(response.body.places[0].placeSnapshot.name).toBe('Golden Gate Bridge');
    });

    it('should include recent activities', async () => {
      // Test: Trip details include activity log
      await TripActivity.create({
        trip: testTrip._id,
        user: testUser._id,
        type: 'trip_updated',
        description: 'Updated trip preferences',
        timestamp: new Date()
      });

      const response = await request(app)
        .get(`/api/trips/${testTrip._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.activities).toHaveLength(1);
      expect(response.body.activities[0].type).toBe('trip_updated');
    });

    it('should reject access to unauthorized trip', async () => {
      // Test: User cannot access trips they're not creator/editor of
      const otherUser = await User.create({
        email: 'other@example.com',
        name: 'Other User',
        authMethods: {
          email: {
            email: 'other@example.com',
            password: 'hashedpassword',
            verified: true
          }
        },
        status: 'active'
      });

      const otherToken = jwt.sign(
        { id: otherUser._id.toString(), email: otherUser.email },
        process.env.JWT_SECRET || 'test-jwt-secret'
      );

      const response = await request(app)
        .get(`/api/trips/${testTrip._id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Not authorized');
    });
  });

  describe('PUT /api/trips/:id', () => {
    let testTrip: any;

    beforeEach(async () => {
      testTrip = await Trip.create({
        title: 'Original Trip',
        description: 'Original description',
        creator: testUser._id,
        destinations: [{
          name: 'SF',
          location: { lat: 37.7749, lng: -122.4194 },
          order: 1
        }],
        durationDays: 3,
        preferences: {
          pace: 'moderate',
          interests: ['food'],
          budget: 'moderate',
          transport: 'walking'
        },
        sourcePlaces: [{
          placeId: testPlace._id,
          savedPlaceId: testWantToGo._id,
          savedPlaceType: 'personal'
        }],
        status: 'planning'
      });
    });

    it('should update trip basic information', async () => {
      // Test: Update trip title, description, status
      const updateData = {
        title: 'Updated Trip Title',
        description: 'Updated description',
        status: 'confirmed'
      };

      const response = await request(app)
        .put(`/api/trips/${testTrip._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Trip Title');
      expect(response.body.description).toBe('Updated description');
      expect(response.body.status).toBe('confirmed');
    });

    it('should update trip preferences', async () => {
      // Test: Update trip preferences
      const updateData = {
        preferences: {
          pace: 'intense',
          interests: ['food', 'adventure'],
          budget: 'luxury',
          transport: 'driving'
        }
      };

      const response = await request(app)
        .put(`/api/trips/${testTrip._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.preferences.pace).toBe('intense');
      expect(response.body.preferences.interests).toContain('adventure');
    });

    it('should log update activities', async () => {
      // Test: Trip updates are logged
      const updateData = {
        title: 'New Title',
        status: 'confirmed'
      };

      await request(app)
        .put(`/api/trips/${testTrip._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      const activities = await TripActivity.find({
        trip: testTrip._id,
        type: 'trip_updated'
      });

      expect(activities.length).toBeGreaterThan(0);
    });

    it('should reject updates from unauthorized users', async () => {
      // Test: Only creator/editor can update trip
      const otherUser = await User.create({
        email: 'other@example.com',
        name: 'Other User',
        authMethods: {
          email: {
            email: 'other@example.com',
            password: 'hashedpassword',
            verified: true
          }
        },
        status: 'active'
      });

      const otherToken = jwt.sign(
        { id: otherUser._id.toString(), email: otherUser.email },
        process.env.JWT_SECRET || 'test-jwt-secret'
      );

      const response = await request(app)
        .put(`/api/trips/${testTrip._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Unauthorized Update' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/trips/:id', () => {
    let testTrip: any;

    beforeEach(async () => {
      testTrip = await Trip.create({
        title: 'Trip to Delete',
        creator: testUser._id,
        destinations: [{
          name: 'SF',
          location: { lat: 37.7749, lng: -122.4194 },
          order: 1
        }],
        durationDays: 2,
        preferences: {
          pace: 'moderate',
          interests: ['food'],
          budget: 'moderate',
          transport: 'walking'
        },
        sourcePlaces: [{
          placeId: testPlace._id,
          savedPlaceId: testWantToGo._id,
          savedPlaceType: 'personal'
        }],
        status: 'planning'
      });
    });

    it('should soft delete trip for creator', async () => {
      // Test: Creator can delete their trip (soft delete)
      const response = await request(app)
        .delete(`/api/trips/${testTrip._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Trip deleted successfully');

      // Verify trip is marked as cancelled
      const deletedTrip = await Trip.findById(testTrip._id);
      expect(deletedTrip?.status).toBe('cancelled');
    });

    it('should log deletion activity', async () => {
      // Test: Trip deletion is logged
      await request(app)
        .delete(`/api/trips/${testTrip._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      const activities = await TripActivity.find({
        trip: testTrip._id,
        type: 'trip_deleted'
      });

      expect(activities).toHaveLength(1);
    });

    it('should reject deletion from non-creator', async () => {
      // Test: Only creator can delete trip
      const otherUser = await User.create({
        email: 'other@example.com',
        name: 'Other User',
        authMethods: {
          email: {
            email: 'other@example.com',
            password: 'hashedpassword',
            verified: true
          }
        },
        status: 'active'
      });

      const otherToken = jwt.sign(
        { id: otherUser._id.toString(), email: otherUser.email },
        process.env.JWT_SECRET || 'test-jwt-secret'
      );

      const response = await request(app)
        .delete(`/api/trips/${testTrip._id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Only trip creator');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all trip routes', async () => {
      // Test: All routes require authentication
      const routes = [
        { method: 'post', path: '/api/trips/generate' },
        { method: 'get', path: '/api/trips' },
        { method: 'get', path: '/api/trips/invalid-id' },
        { method: 'put', path: '/api/trips/invalid-id' },
        { method: 'delete', path: '/api/trips/invalid-id' }
      ];

      for (const route of routes) {
        const response = await request(app)[route.method](route.path);
        expect(response.status).toBe(401);
      }
    });

    it('should validate MongoDB ObjectIds', async () => {
      // Test: Invalid ObjectIds are rejected
      const invalidId = 'invalid-id';

      const response = await request(app)
        .get(`/api/trips/${invalidId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid trip ID');
    });
  });
});
