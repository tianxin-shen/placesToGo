import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Group, ApiResponse } from '../types/api';
import { useAuth } from './AuthContext';
import { apiRequest, getFetchOptions } from '../api/client';

interface GroupContextType {
  currentGroup: Group | null;
  recentGroups: Group[];
  isLoading: boolean;
  error: string | null;
  setCurrentGroup: (group: Group | null) => void;
  createGroup: (name: string, description?: string) => Promise<Group>;
  joinGroup: (shareCode: string) => Promise<Group>;
  leaveGroup: (groupId: string) => Promise<void>;
  fetchUserGroups: () => Promise<Group[]>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

// Local storage keys
const CURRENT_GROUP_KEY = 'current_group';
const RECENT_GROUPS_KEY = 'recent_groups';

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getAccessToken } = useAuth();
  const [currentGroup, setCurrentGroupState] = useState<Group | null>(() => {
    const stored = localStorage.getItem(CURRENT_GROUP_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [recentGroups, setRecentGroups] = useState<Group[]>(() => {
    const stored = localStorage.getItem(RECENT_GROUPS_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update local storage when current group changes
  const setCurrentGroup = useCallback((group: Group | null) => {
    if (group) {
      localStorage.setItem(CURRENT_GROUP_KEY, JSON.stringify(group));
      // Update recent groups
      setRecentGroups(prev => {
        const filtered = prev.filter(g => g.id !== group.id);
        const updated = [group, ...filtered].slice(0, 5); // Keep last 5 groups
        localStorage.setItem(RECENT_GROUPS_KEY, JSON.stringify(updated));
        return updated;
      });
    } else {
      localStorage.removeItem(CURRENT_GROUP_KEY);
    }
    setCurrentGroupState(group);
  }, []);

  const createGroup = useCallback(async (name: string, description?: string): Promise<Group> => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('No access token available');

      const response = await apiRequest<ApiResponse<Group>>(
        '/groups',
        getFetchOptions('POST', { name, description })
      );
      const group = response.data;
      setCurrentGroup(group);
      return group;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create group';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken, setCurrentGroup]);

  const joinGroup = useCallback(async (shareCode: string): Promise<Group> => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('No access token available');

      const response = await apiRequest<ApiResponse<{ group: Group }>>(
        '/groups/join',
        getFetchOptions('POST', { shareCode })
      );
      const { group } = response.data;
      setCurrentGroup(group);
      return group;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join group';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken, setCurrentGroup]);

  const leaveGroup = useCallback(async (groupId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('No access token available');

      await apiRequest<ApiResponse<void>>(
        `/groups/${groupId}/leave`,
        getFetchOptions('DELETE')
      );

      // If leaving current group, clear it
      if (currentGroup?.id === groupId) {
        setCurrentGroup(null);
      }
      // Remove from recent groups
      setRecentGroups(prev => {
        const filtered = prev.filter(g => g.id !== groupId);
        localStorage.setItem(RECENT_GROUPS_KEY, JSON.stringify(filtered));
        return filtered;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to leave group';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentGroup, getAccessToken, setCurrentGroup]);

  const fetchUserGroups = useCallback(async (): Promise<Group[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('No access token available');

      const response = await apiRequest<ApiResponse<Group[]>>(
        '/groups',
        getFetchOptions('GET')
      );
      const groups = response.data;
      return groups;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch groups';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  const value: GroupContextType = {
    currentGroup,
    recentGroups,
    isLoading,
    error,
    setCurrentGroup,
    createGroup,
    joinGroup,
    leaveGroup,
    fetchUserGroups,
  };

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = () => {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
};
