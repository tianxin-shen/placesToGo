import GroupPlace, { IGroupPlace } from '../../src/models/GroupPlace';
import User from '../../src/models/User';
import Group from '../../src/models/Group';
import GroupMember from '../../src/models/GroupMember';
import Place from '../../src/models/Place';

describe('GroupPlace Model', () => {
  let testUser: any;
  let testGroup: any;
  let inactiveUser: any;
  let archivedGroup: any;
  let testPlace: any;
  let nonexistentPlaceId: string;

  beforeEach(async () => {
    // Create test users
    testUser = await User.create({
      email: 'active@example.com',
      name: 'Active User',
      authMethods: {
        email: {
          email: 'active@example.com',
          password: 'hashedpassword',
          verified: true
        }
      },
      status: 'active'
    });

    inactiveUser = await User.create({
      email: 'inactive@example.com',
      name: 'Inactive User',
      authMethods: {
        email: {
          email: 'inactive@example.com',
          password: 'hashedpassword',
          verified: true
        }
      },
      status: 'inactive'
    });

    // Create test groups
    testGroup = await Group.create({
      name: 'Active Test Group',
      shareCode: 'ACTIVE123',
      status: 'active'
    });

    archivedGroup = await Group.create({
      name: 'Archived Test Group',
      shareCode: 'ARCHIVED456',
      status: 'archived'
    });

    // Add active user to active group
    await GroupMember.create({
      group_id: testGroup._id,
      user_id: testUser._id,
      role: 'editor',
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

    nonexistentPlaceId = 'nonexistent_place_999';
  });

  describe('GroupPlace Creation and Validation', () => {
    it('should create valid group place', async () => {
      // Test: Create valid group place with all requirements met
      const groupPlace = await GroupPlace.create({
        group_id: testGroup._id,
        place_id: testPlace.place_id,
        added_by: testUser._id,
        location_group: 'Test City',
        type_group: 'restaurant',
        status: 'pending'
      });

      expect(groupPlace.group_id.toString()).toBe(testGroup._id.toString());
      expect(groupPlace.place_id).toBe(testPlace.place_id);
      expect(groupPlace.added_by.toString()).toBe(testUser._id.toString());
      expect(groupPlace.status).toBe('pending');
    });

    it('should prevent adding places to archived groups', async () => {
      // Test: Validation prevents adding places to archived groups
      await expect(GroupPlace.create({
        group_id: archivedGroup._id,
        place_id: testPlace.place_id,
        added_by: testUser._id,
        location_group: 'Test City',
        type_group: 'restaurant',
        status: 'pending'
      })).rejects.toThrow('Cannot add places to inactive or archived group');
    });

    it('should prevent non-members from adding places', async () => {
      // Test: Only group members can add places to groups
      const nonMember = await User.create({
        email: 'nonmember@example.com',
        name: 'Non Member',
        authMethods: {
          email: {
            email: 'nonmember@example.com',
            password: 'hashedpassword',
            verified: true
          }
        },
        status: 'active'
      });

      await expect(GroupPlace.create({
        group_id: testGroup._id,
        place_id: testPlace.place_id,
        added_by: nonMember._id, // Not a group member
        location_group: 'Test City',
        type_group: 'restaurant',
        status: 'pending'
      })).rejects.toThrow('User is not an active member of this group');
    });

    it('should prevent adding nonexistent places', async () => {
      // Test: Validation ensures place exists in database
      await expect(GroupPlace.create({
        group_id: testGroup._id,
        place_id: nonexistentPlaceId, // Place doesn't exist
        added_by: testUser._id,
        location_group: 'Test City',
        type_group: 'restaurant',
        status: 'pending'
      })).rejects.toThrow('Place does not exist in database');
    });

    it('should enforce unique place per group', async () => {
      // Test: Same place cannot be added twice to same group
      await GroupPlace.create({
        group_id: testGroup._id,
        place_id: testPlace.place_id,
        added_by: testUser._id,
        location_group: 'Test City',
        type_group: 'restaurant',
        status: 'pending'
      });

      await expect(GroupPlace.create({
        group_id: testGroup._id,
        place_id: testPlace.place_id, // Same place, same group
        added_by: testUser._id,
        location_group: 'Test City',
        type_group: 'restaurant',
        status: 'pending'
      })).rejects.toThrow(); // Should fail due to unique index
    });
  });

  describe('GroupPlace Status Management', () => {
    let testGroupPlace: IGroupPlace;

    beforeEach(async () => {
      testGroupPlace = await GroupPlace.create({
        group_id: testGroup._id,
        place_id: testPlace.place_id,
        added_by: testUser._id,
        location_group: 'Test City',
        type_group: 'restaurant',
        status: 'pending'
      });
    });

    it('should allow status changes from pending to visited', async () => {
      // Test: Status transitions work correctly
      testGroupPlace.status = 'visited';
      await testGroupPlace.save();

      expect(testGroupPlace.status).toBe('visited');
    });

    it('should prevent removal by non-group-members', async () => {
      // Test: Only group members can remove places
      const nonMember = await User.create({
        email: 'remover@example.com',
        name: 'Remover User',
        authMethods: {
          email: {
            email: 'remover@example.com',
            password: 'hashedpassword',
            verified: true
          }
        },
        status: 'active'
      });

      testGroupPlace.status = 'removed';
      testGroupPlace.removed_by = nonMember._id; // Not a group member

      await expect(testGroupPlace.save()).rejects.toThrow('User removing place is not an active member of this group');
    });

    it('should allow removal by group members', async () => {
      // Test: Group members can remove places
      testGroupPlace.status = 'removed';
      testGroupPlace.removed_by = testUser._id; // Group member

      await expect(testGroupPlace.save()).resolves.not.toThrow();
      expect(testGroupPlace.status).toBe('removed');
    });

    it('should handle skipped status', async () => {
      // Test: Places can be marked as skipped
      testGroupPlace.status = 'skipped';
      await testGroupPlace.save();

      expect(testGroupPlace.status).toBe('skipped');
    });

    it('should handle cancelled status', async () => {
      // Test: Places can be marked as cancelled
      testGroupPlace.status = 'cancelled';
      await testGroupPlace.save();

      expect(testGroupPlace.status).toBe('cancelled');
    });
  });

  describe('GroupPlace Metadata Management', () => {
    it('should store and update location_group', async () => {
      // Test: Location grouping works correctly
      const groupPlace = await GroupPlace.create({
        group_id: testGroup._id,
        place_id: testPlace.place_id,
        added_by: testUser._id,
        location_group: 'San Francisco',
        type_group: 'restaurant',
        status: 'pending'
      });

      expect(groupPlace.location_group).toBe('San Francisco');

      // Update location group
      groupPlace.location_group = 'Bay Area';
      await groupPlace.save();

      expect(groupPlace.location_group).toBe('Bay Area');
    });

    it('should store and update type_group', async () => {
      // Test: Type grouping works correctly
      const groupPlace = await GroupPlace.create({
        group_id: testGroup._id,
        place_id: testPlace.place_id,
        added_by: testUser._id,
        location_group: 'Test City',
        type_group: 'attraction',
        status: 'pending'
      });

      expect(groupPlace.type_group).toBe('attraction');

      // Update type group
      groupPlace.type_group = 'food';
      await groupPlace.save();

      expect(groupPlace.type_group).toBe('food');
    });

    it('should handle priority levels', async () => {
      // Test: Priority levels work correctly
      const groupPlace = await GroupPlace.create({
        group_id: testGroup._id,
        place_id: testPlace.place_id,
        added_by: testUser._id,
        location_group: 'Test City',
        type_group: 'restaurant',
        priority: 5, // High priority
        status: 'pending'
      });

      expect(groupPlace.priority).toBe(5);

      // Update priority
      groupPlace.priority = 1; // Low priority
      await groupPlace.save();

      expect(groupPlace.priority).toBe(1);
    });

    it('should store notes and planned visit dates', async () => {
      // Test: Additional metadata storage works
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // One week from now

      const groupPlace = await GroupPlace.create({
        group_id: testGroup._id,
        place_id: testPlace.place_id,
        added_by: testUser._id,
        location_group: 'Test City',
        type_group: 'restaurant',
        notes: 'Must try the special dish!',
        plannedVisitDate: futureDate,
        status: 'pending'
      });

      expect(groupPlace.notes).toBe('Must try the special dish!');
      expect(groupPlace.plannedVisitDate).toEqual(futureDate);
    });
  });

  describe('Database Indexes', () => {
    it('should have proper indexes for query performance', async () => {
      // Test: Verify critical indexes exist
      const collection = GroupPlace.collection;
      const indexes = await collection.indexes();
      const indexNames = indexes.map((idx: any) => idx.name);

      // Should have compound unique index for group + place
      expect(indexNames.some(name => name.includes('group_id') && name.includes('place_id'))).toBe(true);

      // Should have individual indexes for common queries
      expect(indexNames.some(name => name.includes('group_id'))).toBe(true);
      expect(indexNames.some(name => name.includes('location_group'))).toBe(true);
      expect(indexNames.some(name => name.includes('type_group'))).toBe(true);
      expect(indexNames.some(name => name.includes('status'))).toBe(true);
    });
  });
});
