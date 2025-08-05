import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiArrowRight, FiChevronDown, FiImage, FiVideo, FiMessageSquare, FiMoon, FiSun, FiMic, FiFileText } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import SimpleLanguageSelector from './SimpleLanguageSelector';
import matrixLogo from '../assets/matrix.png';

interface HomeNavbarProps {}

const HomeNavbar2: React.FC<HomeNavbarProps> = () => {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState<string>('');
  const { darkMode, toggleDarkMode } = useTheme();
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    // Set current page name based on location
    if (location.pathname.includes('/tools/image-generator')) {
      setCurrentPage('Image Generator');
    } else if (location.pathname.includes('/tools/video-creator')) {
      setCurrentPage('Video Generator');
    } else if (location.pathname.includes('/chat')) {
      setCurrentPage('AI Chat');
    } else if (location.pathname.includes('/tools/speech-to-text')) {
      setCurrentPage('Speech to Text');
    } else if (location.pathname.includes('/tools/content-writer')) {
      setCurrentPage('Content Writer');
    } else {
      setCurrentPage('');
    }
  }, [location]);
  
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <nav className={`w-full px-4 py-0.5 ${darkMode ? 'bg-black' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="px-2 py-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-4">
              <Link to="/" className="flex items-center space-x-2 pl-0">
                <img src={matrixLogo} alt="Matrix AI" className="w-12 h-12 md:w-16 md:h-16 object-contain -my-2" />
                <span className={`font-bold text-sm md:text-base hidden sm:block ${darkMode ? 'text-white' : 'text-gray-800'}`}>matrixai<span className="text-red-500">.</span>asia</span>
              </Link>
              
              {/* Tools Dropdown - Hidden on mobile */}
              <div className="relative hidden md:block">
                <button 
                  onClick={toggleDropdown}
                  className={`flex items-center transition-colors duration-200 text-sm px-3 py-1.5 rounded-md border ${
                    darkMode 
                      ? 'text-gray-200 hover:text-white bg-gray-800 border-gray-700' 
                      : 'text-gray-700 hover:text-gray-800 bg-gray-100 border-gray-300'
                  }`}
                >
                  <span>{currentPage || 'Tools'}</span>
                  <FiChevronDown className={`ml-1 w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Tools Dropdown Menu */}
                {isDropdownOpen && (
                  <div className={`absolute left-0 mt-1 w-[350px] rounded-lg shadow-lg backdrop-blur-md border z-50 ${
                    darkMode 
                      ? 'bg-black/90 border-gray-700' 
                      : 'bg-white/90 border-gray-300'
                  }`}>
                    <div className="py-2 px-2">
                      <div className="flex flex-col space-y-1">
                        <Link 
                          to="/tools/image-generator" 
                          className={`flex items-center px-4 py-2 text-sm transition-colors duration-150 rounded-md ${
                            darkMode 
                              ? 'text-gray-200 hover:bg-gray-800' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <div className={`p-2 rounded-lg mr-3 ${
                            darkMode ? 'bg-gray-800/50' : 'bg-gray-200/50'
                          }`}>
                            <FiImage className={`h-4 w-4 ${
                              darkMode ? 'text-gray-300' : 'text-gray-600'
                            }`} />
                          </div>
                          <div className="flex-1 whitespace-nowrap">
                            <div className="font-medium text-sm">Image Generator</div>
                            <div className={`text-xs ${
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>Create images from text</div>
                          </div>
                        </Link>
                        
                        <Link 
                           to="/tools/video-creator" 
                           className={`flex items-center px-4 py-2 text-sm transition-colors duration-150 rounded-md ${
                             darkMode 
                               ? 'text-gray-200 hover:bg-gray-800' 
                               : 'text-gray-700 hover:bg-gray-100'
                           }`}
                           onClick={() => setIsDropdownOpen(false)}
                         >
                           <div className={`p-2 rounded-lg mr-3 ${
                             darkMode ? 'bg-gray-800/50' : 'bg-gray-200/50'
                           }`}>
                             <FiVideo className={`h-4 w-4 ${
                               darkMode ? 'text-gray-300' : 'text-gray-600'
                             }`} />
                           </div>
                           <div className="flex-1 whitespace-nowrap">
                             <div className="font-medium text-sm">Video Generator</div>
                             <div className={`text-xs ${
                               darkMode ? 'text-gray-400' : 'text-gray-500'
                             }`}>Create videos from text</div>
                           </div>
                         </Link>
                        
                        <Link 
                          to="/tools/speech-to-text" 
                          className={`flex items-center px-4 py-2 text-sm transition-colors duration-150 rounded-md ${
                            darkMode 
                              ? 'text-gray-200 hover:bg-gray-800' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <div className={`p-2 rounded-lg mr-3 ${
                            darkMode ? 'bg-gray-800/50' : 'bg-gray-200/50'
                          }`}>
                            <FiMic className={`h-4 w-4 ${
                              darkMode ? 'text-gray-300' : 'text-gray-600'
                            }`} />
                          </div>
                          <div className="flex-1 whitespace-nowrap">
                            <div className="font-medium text-sm">Speech to Text</div>
                            <div className={`text-xs ${
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>Convert speech to text</div>
                          </div>
                        </Link>
                        
                        <Link 
                          to="/tools/content-writer" 
                          className={`flex items-center px-4 py-2 text-sm transition-colors duration-150 rounded-md ${
                            darkMode 
                              ? 'text-gray-200 hover:bg-gray-800' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <div className={`p-2 rounded-lg mr-3 ${
                            darkMode ? 'bg-gray-800/50' : 'bg-gray-200/50'
                          }`}>
                            <FiFileText className={`h-4 w-4 ${
                              darkMode ? 'text-gray-300' : 'text-gray-600'
                            }`} />
                          </div>
                          <div className="flex-1 whitespace-nowrap">
                            <div className="font-medium text-sm">Content Writer</div>
                            <div className={`text-xs ${
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>Generate written content</div>
                          </div>
                        </Link>
                        
                        <Link 
                           to="/chat" 
                           className={`flex items-center px-4 py-2 text-sm transition-colors duration-150 rounded-md ${
                             darkMode 
                               ? 'text-gray-200 hover:bg-gray-800' 
                               : 'text-gray-700 hover:bg-gray-100'
                           }`}
                           onClick={() => setIsDropdownOpen(false)}
                         >
                           <div className={`p-2 rounded-lg mr-3 ${
                             darkMode ? 'bg-gray-800/50' : 'bg-gray-200/50'
                           }`}>
                             <FiMessageSquare className={`h-4 w-4 ${
                               darkMode ? 'text-gray-300' : 'text-gray-600'
                             }`} />
                           </div>
                           <div className="flex-1 whitespace-nowrap">
                             <div className="font-medium text-sm">AI Chat</div>
                             <div className={`text-xs ${
                               darkMode ? 'text-gray-400' : 'text-gray-500'
                             }`}>Chat with AI assistant</div>
                           </div>
                         </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-1 md:space-x-3">
              {/* Dark Mode Toggle - Hidden on mobile */}
              <button 
                onClick={toggleDarkMode}
                className={`hidden md:block p-1.5 rounded-lg transition-colors duration-200 ${
                  darkMode 
                    ? 'text-gray-300 hover:bg-gray-800' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
              </button>

              {/* Language Selector - Visible on both desktop and mobile */}
              <div>
                <SimpleLanguageSelector />
              </div>
              
              <Link 
                to="/signup" 
                className="inline-flex items-center px-2 py-1 md:px-3 md:py-1.5 rounded-lg font-medium text-xs bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-300"
              >
                <span className="hidden sm:inline">Get started now</span>
                <span className="sm:hidden">Sign up</span>
                <FiArrowRight className="ml-1 md:ml-1.5 w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default HomeNavbar2;