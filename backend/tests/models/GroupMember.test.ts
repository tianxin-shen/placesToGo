import GroupMember, { IGroupMember } from '../../src/models/GroupMember';
import User from '../../src/models/User';
import Group from '../../src/models/Group';

describe('GroupMember Model', () => {
  let testUser: any;
  let testGroup: any;
  let inactiveUser: any;
  let archivedGroup: any;

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
      status: 'inactive' // Inactive user
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
  });

  describe('GroupMember Creation and Validation', () => {
    it('should create valid group membership', async () => {
      // Test: Create valid group membership for active user and group
      const membership = await GroupMember.create({
        group_id: testGroup._id,
        user_id: testUser._id,
        role: 'editor',
        status: 'active'
      });

      expect(membership.group_id.toString()).toBe(testGroup._id.toString());
      expect(membership.user_id.toString()).toBe(testUser._id.toString());
      expect(membership.role).toBe('editor');
      expect(membership.status).toBe('active');
    });

    it('should prevent membership in inactive groups', async () => {
      // Test: Validation middleware prevents adding users to archived groups
      await expect(GroupMember.create({
        group_id: archivedGroup._id,
        user_id: testUser._id,
        role: 'editor',
        status: 'active'
      })).rejects.toThrow('Cannot join inactive or archived group');
    });

    it('should prevent inactive users from joining groups', async () => {
      // Test: Validation prevents inactive users from joining groups
      await expect(GroupMember.create({
        group_id: testGroup._id,
        user_id: inactiveUser._id,
        role: 'editor',
        status: 'active'
      })).rejects.toThrow('Cannot add inactive user to group');
    });

    it('should enforce unique membership per user-group pair', async () => {
      // Test: Same user cannot have multiple memberships in same group
      await GroupMember.create({
        group_id: testGroup._id,
        user_id: testUser._id,
        role: 'editor',
        status: 'active'
      });

      await expect(GroupMember.create({
        group_id: testGroup._id,
        user_id: testUser._id, // Same user, same group
        role: 'editor',
        status: 'active'
      })).rejects.toThrow(); // Should fail due to unique index
    });
  });

  describe('Role Management and Business Rules', () => {
    it('should allow only one owner per group', async () => {
      // Test: Only one owner allowed per group
      await GroupMember.create({
        group_id: testGroup._id,
        user_id: testUser._id,
        role: 'owner',
        status: 'active'
      });

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

      await expect(GroupMember.create({
        group_id: testGroup._id,
        user_id: otherUser._id,
        role: 'owner', // Trying to create second owner
        status: 'active'
      })).rejects.toThrow('Group already has an owner');
    });

    it('should prevent removing last owner from group', async () => {
      // Test: Cannot remove the last owner from a group
      const membership = await GroupMember.create({
        group_id: testGroup._id,
        user_id: testUser._id,
        role: 'owner',
        status: 'active'
      });

      // Try to deactivate the owner
      membership.status = 'left';
      await expect(membership.save()).rejects.toThrow('Cannot remove last owner from group');
    });

    it('should prevent changing last owner role', async () => {
      // Test: Cannot change the last owner's role
      const membership = await GroupMember.create({
        group_id: testGroup._id,
        user_id: testUser._id,
        role: 'owner',
        status: 'active'
      });

      // Try to change owner to editor
      membership.role = 'editor';
      await expect(membership.save()).rejects.toThrow('Cannot change role of last owner');
    });

    it('should allow role changes when there are multiple owners', async () => {
      // Test: Role changes allowed when there are multiple owners
      const owner1 = await GroupMember.create({
        group_id: testGroup._id,
        user_id: testUser._id,
        role: 'owner',
        status: 'active'
      });

      const owner2 = await User.create({
        email: 'owner2@example.com',
        name: 'Owner 2',
        authMethods: {
          email: {
            email: 'owner2@example.com',
            password: 'hashedpassword',
            verified: true
          }
        },
        status: 'active'
      });

      await GroupMember.create({
        group_id: testGroup._id,
        user_id: owner2._id,
        role: 'owner', // Second owner
        status: 'active'
      });

      // Now changing first owner to editor should work
      owner1.role = 'editor';
      await expect(owner1.save()).resolves.not.toThrow();
      expect(owner1.role).toBe('editor');
    });
  });

  describe('Database Indexes', () => {
    it('should have proper indexes for query performance', async () => {
      // Test: Verify critical indexes exist
      const collection = GroupMember.collection;
      const indexes = await collection.indexes();
      const indexNames = indexes.map((idx: any) => idx.name);

      // Should have compound unique index
      expect(indexNames.some(name => name.includes('group_id') && name.includes('user_id'))).toBe(true);

      // Should have status filter index
      expect(indexNames.some(name => name.includes('user_id') && name.includes('status'))).toBe(true);
    });
  });

  describe('Membership Status Transitions', () => {
    it('should handle pending to active status change', async () => {
      // Test: Status changes from pending to active work correctly
      const membership = await GroupMember.create({
        group_id: testGroup._id,
        user_id: testUser._id,
        role: 'editor',
        status: 'pending'
      });

      membership.status = 'active';
      await membership.save();

      expect(membership.status).toBe('active');
    });

    it('should handle active to left status change', async () => {
      // Test: Members can leave groups (for non-owners)
      const membership = await GroupMember.create({
        group_id: testGroup._id,
        user_id: testUser._id,
        role: 'editor',
        status: 'active'
      });

      membership.status = 'left';
      await membership.save();

      expect(membership.status).toBe('left');
    });
  });
});
