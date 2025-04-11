import React, { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiHome, 
  FiMessageSquare, 
  FiImage,
  FiVideo,
  FiFileText,
  FiLayers,
  FiSettings, 
  FiHelpCircle,
  FiLogOut,
  FiChevronLeft,
  FiMenu,
  FiUser
} from 'react-icons/fi';
import { ThemeContext } from '../context/ThemeContext';

interface SidebarProps {}

const Sidebar: React.FC<SidebarProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Navigation items
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <FiHome className="w-5 h-5" /> },
    { path: '/chat', label: 'AI Chat', icon: <FiMessageSquare className="w-5 h-5" /> },
    { path: '/tools/image-generator', label: 'Image Generator', icon: <FiImage className="w-5 h-5" /> },
    { path: '/tools/video-creator', label: 'Video Creator', icon: <FiVideo className="w-5 h-5" /> },
    { path: '/tools/content-writer', label: 'Content Writer', icon: <FiFileText className="w-5 h-5" /> },
    { path: '/tools/presentation-creator', label: 'Presentations', icon: <FiLayers className="w-5 h-5" /> },
    { path: '/profile', label: 'Profile', icon: <FiUser className="w-5 h-5" /> },
    { path: '/settings', label: 'Settings', icon: <FiSettings className="w-5 h-5" /> },
    { path: '/help', label: 'Help & Support', icon: <FiHelpCircle className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Mobile Sidebar Toggle Button */}
      <div className="fixed bottom-4 right-4 md:hidden z-50">
        <button 
          onClick={toggleMobileMenu}
          className={`p-3 rounded-full shadow-lg ${
            darkMode 
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
              : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
          }`}
        >
          <FiMenu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Sidebar (overlay) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 ${
          collapsed ? 'w-16' : 'w-64'
        } ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        } border-r md:sticky`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8 px-2">
            {!collapsed && (
              <Link to="/dashboard" className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  AI
                </div>
                <span className="ml-2 self-center text-xl font-semibold whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                  MatrixAI
                </span>
              </Link>
            )}
            <button 
              onClick={toggleSidebar}
              className={`p-2 rounded-lg ${
                darkMode 
                  ? 'text-gray-400 hover:bg-gray-700' 
                  : 'text-gray-500 hover:bg-gray-100'
              } ${collapsed ? 'mx-auto' : ''}`}
            >
              <FiChevronLeft className={`w-5 h-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center ${
                    collapsed ? 'justify-center' : 'justify-start'
                  } p-2 text-base font-normal rounded-lg ${
                    isActive(item.path)
                      ? darkMode 
                        ? 'bg-gray-700 text-purple-400' 
                        : 'bg-blue-50 text-blue-600'
                      : darkMode
                        ? 'text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span className="ml-3">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-auto pt-4 space-y-2 border-t border-gray-200 absolute bottom-4 left-3 right-3">
            <button
              onClick={handleLogout}
              className={`flex items-center ${
                collapsed ? 'justify-center' : 'justify-start'
              } p-2 text-base font-normal rounded-lg ${
                darkMode
                  ? 'text-red-400 hover:bg-gray-700'
                  : 'text-red-600 hover:bg-red-50'
              } w-full`}
            >
              <FiLogOut className="w-5 h-5" />
              {!collapsed && <span className="ml-3">Logout</span>}
            </button>
            
            {!collapsed && (
              <div className={`px-2 py-3 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <p>MatrixAI v1.0</p>
                <p>© {new Date().getFullYear()}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar; 