import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
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
  FiStar,
  FiMenu
} from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { useTranslation } from 'react-i18next';
import ChargeModal from './ChargeModal';
import LanguageSelector from './LanguageSelector';
import coinImage from '../assets/coin.png';
import { supabase } from '../supabaseClient';

interface NavbarProps {
  onMobileSidebarToggle?: () => void;
  isMobileSidebarOpen?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onMobileSidebarToggle, isMobileSidebarOpen }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { darkMode, toggleDarkMode } = useTheme();
  const { user, signOut } = useAuth();
  const { userData, refreshUserData } = useUser();
  const { isPro } = useUser();
  const { t } = useTranslation();
  const [localCoins, setLocalCoins] = useState<number | undefined>(userData?.coins);

  // Update local coins when userData changes (UserContext handles real-time updates)
  useEffect(() => {
    setLocalCoins(userData?.coins);
  }, [userData?.coins]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error: any) {
      // Only log actual errors, not session missing errors
      if (error.message && !error.message.includes('Auth session missing')) {
        console.error('Error signing out:', error);
      }
      // Always navigate to login regardless of error
      // since the user intent is to sign out
      navigate('/login');
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
      darkMode ? 'backdrop-blur-md bg-black/20 border-gray-700 text-white' : 'backdrop-blur-md bg-white/20 border-gray-200 text-gray-800'
    } border-b sticky top-0 z-30 w-full flex-none h-16`}>
      <div className="max-w-screen-2xl mx-auto w-full h-full flex items-center justify-between px-4">
        <div className="flex items-center flex-grow-0 flex-shrink-0">
          {/* Mobile sidebar toggle button */}
          {!isMobileSidebarOpen && (
            <button 
              onClick={onMobileSidebarToggle}
              className={`md:hidden p-2 rounded-lg mr-2 ${
                darkMode 
                  ? 'text-gray-300 hover:bg-gray-700' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              aria-label="Toggle mobile menu"
            >
              <FiMenu className="w-5 h-5" />
            </button>
          )}
          
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
              className={`block max-w-[240px] w-full p-2 pl-10 text-sm rounded-lg border-2 ${
                darkMode 
                  ? 'bg-black/30 border-gray-500 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-400' 
                  : 'bg-white/30 border-gray-400 text-gray-900 focus:ring-blue-500 focus:border-blue-400'
              }`}
              placeholder={t('dashboard.search')}
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
              <span className="font-medium">{t('dashboard.upgrade')}</span>
            </button>
          )}
          
          {isPro && user && (localCoins !== undefined ? localCoins < 200 : (userData?.coins || 0) < 200) && (
            <button
              onClick={() => {
                console.log('Buy Coins button clicked, opening charge modal');
                setShowChargeModal(true);
              }}
              className="flex items-center px-3 py-1.5 rounded-lg text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:opacity-90 transition-opacity"
            >
              <FiPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
              <span className="font-medium">{t('dashboard.buyCoins')}</span>
            </button>
          )}

          {/* User Coins - Make it clickable to open charge modal */}
          {user && (
            <button
              onClick={() => {
                console.log('Coin button clicked, opening charge modal');
                setShowChargeModal(true);
              }}
              className={`flex items-center px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm hover:opacity-80 transition-opacity ${
                darkMode 
                  ? 'bg-amber-900/30 text-amber-300 hover:bg-amber-900/40' 
                  : 'bg-amber-100 text-amber-600 hover:bg-amber-200'
              }`}
              title={t('dashboard.clickToBuyCoins')}
            >
              <img src={coinImage} alt="Coin" className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
              <span className="font-medium">{localCoins !== undefined ? localCoins : (userData?.coins || 0)}</span>
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button 
            onClick={toggleDarkMode}
            className={`p-1.5 sm:p-2 rounded-lg ${
              darkMode 
                ? 'text-yellow-300 hover:bg-gray-700' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            aria-label={t('dashboard.toggleDarkMode')}
          >
            {darkMode ? <FiSun className="w-4 h-4 sm:w-5 sm:h-5" /> : <FiMoon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Language Selector */}
          <LanguageSelector />

          {/* Help Button - Hidden on small mobile */}
          <button className={`hidden sm:block p-1.5 sm:p-2 rounded-lg ${
            darkMode 
              ? 'text-gray-300 hover:bg-gray-700' 
              : 'text-gray-500 hover:bg-gray-100'
          }`}>
            <FiHelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>



          {/* User Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center"
            >
              <span className="sr-only">{t('dashboard.openUserMenu')}</span>
              {userData?.dp_url ? (
                <img 
                  src={userData.dp_url} 
                  alt={userData.name || t('dashboard.user')} 
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
                darkMode ? 'backdrop-blur-md bg-black/90 border border-gray-700 ring-gray-700' : 'backdrop-blur-md bg-white/90 border border-gray-200 ring-black ring-opacity-5'
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
                      {userData.user_plan} {t('dashboard.plan')}
                    </div>
                  )}
                </div>
                <ul className="py-1 text-sm">
                  <li>
                    <Link to="/profile" className={`block py-2 px-4 ${
                      darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}>{t('dashboard.profile')}</Link>
                  </li>
                  <li>
                    <Link to="/transactions" className={`block py-2 px-4 ${
                      darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}>{t('dashboard.transactions')}</Link>
                  </li>
                  <li>
                    <Link to="/order-history" className={`block py-2 px-4 ${
                      darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}>{t('dashboard.orderHistory')}</Link>
                  </li>
                  <li>
                    <Link to="/referral" className={`block py-2 px-4 ${
                      darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}>{t('dashboard.referEarn')}</Link>
                  </li>
                  <li>
                    <Link to="/settings" className={`block py-2 px-4 ${
                      darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}>{t('dashboard.settings')}</Link>
                  </li>
                </ul>
                <div className={`py-1 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <button
                    onClick={handleLogout}
                    className={`flex items-center w-full text-left py-2 px-4 text-sm ${
                      darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-gray-100'
                    }`}
                  >
                    <FiLogOut className="mr-2 h-4 w-4" /> {t('dashboard.signOut')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar - Expandable */}
      {showSearchBar && (
        <div className="md:hidden pt-2 pb-2 px-2 border-t border-gray-200 dark:border-gray-700 backdrop-blur-md bg-black/20">
          <div className="relative">
            <div className={`absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <FiSearch />
            </div>
            <input
              type="text"
              className={`block w-full p-2 pl-10 text-sm rounded-lg border-2 ${
                darkMode 
                  ? 'bg-black/30 border-gray-500 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-400' 
                  : 'bg-white/30 border-gray-400 text-gray-900 focus:ring-blue-500 focus:border-blue-400'
              }`}
              placeholder={t('dashboard.search')}
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Charge Modal */}
      <ChargeModal
        isOpen={showChargeModal}
        onClose={() => setShowChargeModal(false)}
        currentCoins={userData?.coins || 0}
      />
    </nav>
  );
};

export default Navbar;