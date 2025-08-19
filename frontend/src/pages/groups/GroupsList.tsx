import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaUserPlus } from 'react-icons/fa';
import { useGroup } from '../../context/GroupContext';
import type { Group } from '../../types/api';

const GroupsList = () => {
  const { fetchUserGroups, setCurrentGroup, isLoading, error } = useGroup();
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    let mounted = true;
    
    const loadGroups = async () => {
      try {
        const userGroups = await fetchUserGroups();
        if (mounted) {
          setGroups(userGroups);
        }
      } catch (err) {
        if (mounted) {
          console.error('Failed to load groups:', err);
        }
      }
    };
    
    loadGroups();
    
    return () => {
      mounted = false;
    };
  }, [fetchUserGroups]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse text-gray-500">Loading groups...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-4">
        Error loading groups: {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Groups</h1>
        <div className="flex gap-2">
          <Link
            to="/groups/create"
            className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-md hover:bg-violet-600 transition-colors"
          >
            <FaPlus className="w-4 h-4" />
            Create Group
          </Link>
          <Link
            to="/groups/join"
            className="flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-md hover:bg-violet-200 transition-colors"
          >
            <FaUserPlus className="w-4 h-4" />
            Join Group
          </Link>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">You haven't joined any groups yet.</p>
          <div className="flex justify-center gap-4">
            <Link
              to="/groups/create"
              className="text-violet-600 hover:text-violet-700 font-medium"
            >
              Create a new group
            </Link>
            <span className="text-gray-400">or</span>
            <Link
              to="/groups/join"
              className="text-violet-600 hover:text-violet-700 font-medium"
            >
              Join an existing group
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map(group => (
            <div
              key={group.id}
              className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{group.name}</h3>
                  {group.description && (
                    <p className="text-sm text-gray-500 mt-1">{group.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setCurrentGroup(group)}
                  className="text-sm text-violet-600 hover:text-violet-700"
                >
                  Switch to
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupsList;
