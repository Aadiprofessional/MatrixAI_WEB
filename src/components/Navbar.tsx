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
  FiMic,
  FiPlus,
  FiStar
} from 'react-icons/fi';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';

interface NavbarProps {}

const Navbar: React.FC<NavbarProps> = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { user, signOut } = useAuth();
  const { userData } = useUser();
  const { isPro } = useUser();

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

  // Toggle mobile search bar
  const toggleSearchBar = () => {
    setShowSearchBar(!showSearchBar);
  };

  // Render app navbar
  return (
    <nav className={`${
      darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'
    } border-b sticky top-0 z-30 w-full flex-none h-16`}>
      <div className="max-w-screen-2xl mx-auto w-full h-full flex items-center justify-between px-4">
        <div className="flex items-center flex-grow-0 flex-shrink-0">
          {/* Brand Logo without visible AI and PRO logo in navbar */}
          <Link to="/dashboard" className="flex items-center mr-4">
            {/* Removed AI logo and PRO badge from navbar */}
          </Link>

          {/* Desktop Search */}
          <div className="relative hidden md:block flex-shrink-0 flex-grow-0">
            <div className={`absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <FiSearch />
            </div>
            <input
              type="text"
              className={`block max-w-[240px] w-full p-2 pl-10 text-sm rounded-lg ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' 
                  : 'bg-gray-50 border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="Search..."
            />
          </div>
        </div>

        {/* Right Navigation */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Mobile search icon - Moved more to the right */}
          <button 
            onClick={toggleSearchBar}
            className={`md:hidden p-2 rounded-lg ${
              darkMode 
                ? 'text-gray-300 hover:bg-gray-700' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <FiSearch className="w-5 h-5" />
          </button>
          
          {/* Subscription and Coin Purchase Buttons - now visible on mobile too */}
          {!isPro && (
            <button
              onClick={() => navigate('/subscription')}
              className="flex items-center px-3 py-1.5 rounded-lg text-xs sm:text-sm bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:opacity-90 transition-opacity"
            >
              <FiStar className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
              <span className="font-medium">Upgrade</span>
            </button>
          )}
          
          {isPro && userData && userData.user_coins && userData.user_coins < 200 && (
            <button
              onClick={() => navigate('/buy', { 
                state: { 
                  uid: user?.id,
                  plan: 'Addon',
                  price: '50 HKD',
                  isAddon: true
                } 
              })}
              className="flex items-center px-3 py-1.5 rounded-lg text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:opacity-90 transition-opacity"
            >
              <FiPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
              <span className="font-medium">Buy Coins</span>
            </button>
          )}

          {/* User Coins */}
          {userData && (
            <div className={`hidden sm:flex items-center px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm ${
              darkMode 
                ? 'bg-amber-900/30 text-amber-300' 
                : 'bg-amber-100 text-amber-600'
            }`}>
              <FiCreditCard className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
              <span className="font-medium">{userData.user_coins || 0}</span>
            </div>
          )}

          {/* Dark Mode Toggle */}
          <button 
            onClick={toggleDarkMode}
            className={`p-1.5 sm:p-2 rounded-lg ${
              darkMode 
                ? 'text-yellow-300 hover:bg-gray-700' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <FiSun className="w-4 h-4 sm:w-5 sm:h-5" /> : <FiMoon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Help Button - Hidden on small mobile */}
          <button className={`hidden sm:block p-1.5 sm:p-2 rounded-lg ${
            darkMode 
              ? 'text-gray-300 hover:bg-gray-700' 
              : 'text-gray-500 hover:bg-gray-100'
          }`}>
            <FiHelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button 
              className={`p-1.5 sm:p-2 rounded-lg ${
                darkMode 
                  ? 'text-gray-300 hover:bg-gray-700' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <div className="relative">
                <FiBell className="w-4 h-4 sm:w-5 sm:h-5" />
                <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[8px] sm:text-[10px] font-bold">3</span>
                </div>
              </div>
            </button>

            {/* Notification Menu */}
            {showNotifications && (
              <div className={`absolute right-0 mt-2 w-72 sm:w-80 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 ${
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
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>AI has new capabilities</p>
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
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                />
              ) : (
                <div className="relative w-7 h-7 sm:w-8 sm:h-8 overflow-hidden rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
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
                    <Link to="/order-history" className={`block py-2 px-4 ${
                      darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}>Order History</Link>
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

      {/* Mobile Search Bar - Expandable */}
      {showSearchBar && (
        <div className="md:hidden pt-2 pb-2 px-2 border-t border-gray-200 dark:border-gray-700">
          <div className="relative">
            <div className={`absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <FiSearch />
            </div>
            <input
              type="text"
              className={`block w-full p-2 pl-10 text-sm rounded-lg ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' 
                  : 'bg-gray-50 border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="Search..."
              autoFocus
            />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 