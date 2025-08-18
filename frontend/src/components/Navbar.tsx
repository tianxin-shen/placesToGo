import { Link, useLocation } from 'react-router-dom';
import { FaCompass, FaHeart, FaRoute, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const { isAuthenticated, user, logout, isLoading } = useAuth();

  const navItems = [
    { path: '/', label: 'Explore', icon: <FaCompass /> },
    { path: '/want-to-go', label: 'Want to Go', icon: <FaHeart /> },
    { path: '/trips', label: 'Trips', icon: <FaRoute /> },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <nav className="fixed flex flex-row items-center bg-white w-full z-10">
        <div className="flex flex-row justify-center items-center h-16">
          {navItems.map((item) => (
            <div
              key={item.path}
              className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-gray-300"
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        <div className="grow flex justify-end pr-4">
          <div className="text-gray-300">Loading...</div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed flex flex-row items-center bg-white w-full z-10">
      <div className="flex flex-row justify-center items-center h-16">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              location.pathname === item.path
                ? 'bg-violet-200 text-white'
                : 'text-gray-300 hover:text-white hover:bg-violet-100'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="grow flex justify-end pr-4">
        {isAuthenticated ? (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {user?.profilePicture ? (
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
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors duration-200"
              title="Logout"
            >
              <FaSignOutAlt />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="text-gray-300 hover:text-white transition-colors duration-200"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 