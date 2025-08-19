import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroup } from '../../context/GroupContext';

const JoinGroup = () => {
  const navigate = useNavigate();
  const { joinGroup, isLoading, error } = useGroup();
  const [shareCode, setShareCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await joinGroup(shareCode);
      navigate('/groups');
    } catch (err) {
      // Error is handled by context
      console.error('Failed to join group:', err);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Join a Group</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="shareCode" className="block text-sm font-medium text-gray-700 mb-1">
            Share Code
          </label>
          <input
            type="text"
            id="shareCode"
            value={shareCode}
            onChange={(e) => setShareCode(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-500"
            placeholder="Enter group share code"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Enter the share code provided by the group owner
          </p>
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/groups')}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !shareCode.trim()}
            className="px-4 py-2 bg-violet-500 text-white rounded-md hover:bg-violet-600 transition-colors disabled:bg-violet-300"
          >
            {isLoading ? 'Joining...' : 'Join Group'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JoinGroup;
