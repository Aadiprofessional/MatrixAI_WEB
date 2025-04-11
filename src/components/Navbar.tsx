import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FiBell, 
  FiHelpCircle, 
  FiSearch, 
  FiSettings,
  FiUser,
  FiLogOut,
  FiMoon,
  FiSun,
  FiCreditCard,
  FiMic
} from 'react-icons/fi';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';

interface NavbarProps {}

const Navbar: React.FC<NavbarProps> = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { user, signOut } = useAuth();
  const { userData } = useUser();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get user display name (full name or email)
  const getUserDisplayName = () => {
    if (userData?.name) return userData.name;
    if (!user) return '';
    
    // Try to get the full name from metadata
    const fullName = user.user_metadata?.full_name;
    
    // If no full name, use email
    return fullName || user.email || '';
  };

  // Get user initial for avatar
  const getUserInitial = () => {
    const displayName = getUserDisplayName();
    return displayName ? displayName.charAt(0).toUpperCase() : '?';
  };

  // Render app navbar
  return (
    <nav className={`${
      darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'
    } border-b px-4 py-2.5 sticky top-0 z-50`}>
      <div className="flex flex-wrap justify-between items-center">
        <div className="flex items-center justify-start">
          {/* Search */}
          <div className="relative">
            <div className={`absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <FiSearch />
            </div>
            <input
              type="text"
              className={`block w-64 p-2 pl-10 text-sm rounded-lg ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' 
                  : 'bg-gray-50 border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="Search..."
            />
          </div>
          
          {/* Speech to Text Link */}
          {/* <Link 
            to="/speech-to-text" 
            className={`ml-4 flex items-center px-4 py-2 rounded-lg ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            } transition-colors`}
          >
            <FiMic className="mr-1.5" />
            <span className="text-sm font-medium">Speech to Text</span>
          </Link> */}
        </div>

        {/* Right Navigation */}
        <div className="flex items-center space-x-3">
          {/* User Coins */}
          {userData && (
            <div className={`flex items-center px-3 py-1.5 rounded-lg ${
              darkMode 
                ? 'bg-amber-900/30 text-amber-300' 
                : 'bg-amber-100 text-amber-600'
            }`}>
              <FiCreditCard className="w-4 h-4 mr-1.5" />
              <span className="text-sm font-medium">{userData.user_coins || 0}</span>
            </div>
          )}

          {/* Dark Mode Toggle */}
          <button 
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg ${
              darkMode 
                ? 'text-yellow-300 hover:bg-gray-700' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
          </button>

          {/* Help Button */}
          <button className={`p-2 rounded-lg ${
            darkMode 
              ? 'text-gray-300 hover:bg-gray-700' 
              : 'text-gray-500 hover:bg-gray-100'
          }`}>
            <FiHelpCircle className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button 
              className={`p-2 rounded-lg ${
                darkMode 
                  ? 'text-gray-300 hover:bg-gray-700' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <div className="relative">
                <FiBell className="w-5 h-5" />
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">3</span>
                </div>
              </div>
            </button>

            {/* Notification Menu */}
            {showNotifications && (
              <div className={`absolute right-0 mt-2 w-80 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 ${
                darkMode ? 'bg-gray-800 ring-gray-700' : 'bg-white'
              }`}>
                <div className={`p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <a href="#" className={`block px-4 py-3 ${darkMode ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-50 border-gray-100'} border-b`}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white">
                        <FiUser className="w-4 h-4" />
                      </div>
                      <div className="ml-3 w-0 flex-1">
                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>New AI Model Available</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Try out our new image generation model</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>2 hours ago</p>
                      </div>
                    </div>
                  </a>
                  <a href="#" className={`block px-4 py-3 ${darkMode ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-50 border-gray-100'} border-b`}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white">
                        <FiSettings className="w-4 h-4" />
                      </div>
                      <div className="ml-3 w-0 flex-1">
                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>System Update Completed</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>MatrixAI has new capabilities</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>1 day ago</p>
                      </div>
                    </div>
                  </a>
                </div>
                <div className={`py-2 px-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <a href="#" className="text-xs font-medium text-blue-500 hover:text-blue-600">View all notifications</a>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center"
            >
              <span className="sr-only">Open user menu</span>
              {userData?.dp_url ? (
                <img 
                  src={userData.dp_url} 
                  alt={userData.name || 'User'} 
                  className="w-8 h-8 rounded-full object-cover border-2 border-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                />
              ) : (
                <div className="relative w-8 h-8 overflow-hidden rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white font-medium">{getUserInitial()}</span>
                </div>
              )}
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg ring-1 focus:outline-none z-50 ${
                darkMode ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-black ring-opacity-5'
              }`}>
                <div className={`py-3 px-4 text-sm border-b ${
                  darkMode ? 'text-gray-200 border-gray-700' : 'text-gray-900 border-gray-200'
                }`}>
                  <div className="font-medium">{getUserDisplayName()}</div>
                  <div className={`truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {user?.email}
                  </div>
                  {userData?.user_plan && (
                    <div className={`mt-1 px-2 py-0.5 text-xs rounded-full inline-block ${
                      darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {userData.user_plan} Plan
                    </div>
                  )}
                </div>
                <ul className="py-1 text-sm">
                  <li>
                    <Link to="/profile" className={`block py-2 px-4 ${
                      darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}>Profile</Link>
                  </li>
                  <li>
                    <Link to="/transactions" className={`block py-2 px-4 ${
                      darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}>Transactions</Link>
                  </li>
                  <li>
                    <Link to="/referral" className={`block py-2 px-4 ${
                      darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}>Refer & Earn</Link>
                  </li>
                  <li>
                    <Link to="/settings" className={`block py-2 px-4 ${
                      darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}>Settings</Link>
                  </li>
                </ul>
                <div className={`py-1 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <button
                    onClick={handleLogout}
                    className={`flex items-center w-full text-left py-2 px-4 text-sm ${
                      darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-gray-100'
                    }`}
                  >
                    <FiLogOut className="mr-2 h-4 w-4" /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 