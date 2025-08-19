import { Menu } from '@headlessui/react'
import { FaUser, FaSignOutAlt, FaUsers, FaPlus, FaUsersCog } from 'react-icons/fa'
import { Link } from 'react-router-dom'

import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import type { UserProfile } from '../types/api';

interface UserMenuProps {
  user: UserProfile | null;
  onLogout: () => void;
}

const UserMenu = ({ user, onLogout }: UserMenuProps) => {
  const { isLoading } = useAuth();
  const { currentGroup, setCurrentGroup } = useGroup();
  
  if (isLoading) {
    return null;
  }
  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center space-x-2 hover:bg-violet-50 rounded-full p-1 transition-colors duration-200">
        {currentGroup ? (
          <>
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
              <FaUsers className="w-5 h-5 text-violet-500" />
            </div>
            <span className="text-sm text-gray-700 hidden sm:block">
              {currentGroup.name}
            </span>
          </>
        ) : (
          <>
            {user && user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <FaUser className="w-6 h-6 text-gray-300" />
            )}
            <span className="text-sm text-gray-700 hidden sm:block">
              {user?.name}
            </span>
          </>
        )}
      </Menu.Button>

      <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
        <div className="py-1">
          {/* Last Active Group */}
          <Menu.Item>
            {({ active }) => (
              <Link
                to={currentGroup ? `/groups/${currentGroup.id}` : '/groups'}
                className={`${
                  active ? 'bg-violet-50 text-gray-900' : 'text-gray-700'
                } flex items-center px-4 py-2 text-sm w-full ${!currentGroup && 'opacity-50'}`}
              >
                <FaUsers className="mr-3 h-4 w-4" />
                {currentGroup ? currentGroup.name : 'No Active Group'}
              </Link>
            )}
          </Menu.Item>

          <div className="border-t border-gray-100 my-1" />

          {/* Group Actions */}
          <Menu.Item>
            {({ active }) => (
              <Link
                to="/groups/create"
                className={`${
                  active ? 'bg-violet-50 text-gray-900' : 'text-gray-700'
                } flex items-center px-4 py-2 text-sm`}
              >
                <FaPlus className="mr-3 h-4 w-4" />
                Create New Group
              </Link>
            )}
          </Menu.Item>

          <Menu.Item>
            {({ active }) => (
              <Link
                to="/groups/join"
                className={`${
                  active ? 'bg-violet-50 text-gray-900' : 'text-gray-700'
                } flex items-center px-4 py-2 text-sm`}
              >
                <FaUsersCog className="mr-3 h-4 w-4" />
                Join Group
              </Link>
            )}
          </Menu.Item>

          <Menu.Item>
            {({ active }) => (
              <Link
                to="/groups"
                className={`${
                  active ? 'bg-violet-50 text-gray-900' : 'text-gray-700'
                } flex items-center px-4 py-2 text-sm`}
              >
                <FaUsers className="mr-3 h-4 w-4" />
                View All Groups
              </Link>
            )}
          </Menu.Item>

          <div className="border-t border-gray-100 my-1" />

          {/* User Actions */}
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={onLogout}
                className={`${
                  active ? 'bg-violet-50 text-gray-900' : 'text-gray-700'
                } flex items-center w-full px-4 py-2 text-sm`}
              >
                <FaSignOutAlt className="mr-3 h-4 w-4" />
                Logout
              </button>
            )}
          </Menu.Item>
        </div>
      </Menu.Items>
    </Menu>
  )
}

export default UserMenu
