import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiChevronDown, FiImage, FiVideo, FiMaximize, FiCrop, FiLayers, FiZoomIn, FiCode, FiFileText, FiUsers, FiHelpCircle, FiMessageSquare, FiEdit3, FiMic, FiDownload } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import SimpleLanguageSelector from './SimpleLanguageSelector';
import matrixLogo from '../assets/matrix.svg';

interface HomeNavbarProps {}


const HomeNavbar: React.FC<HomeNavbarProps> = () => {
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showResourcesDropdown, setShowResourcesDropdown] = useState(false);
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  
  const toolsRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);
  
  // No longer need toggle functions for hover behavior
  // Instead, we'll use CSS hover states
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-1">
      <div className="max-w-7xl mx-auto">
        <div className={`backdrop-blur-md rounded-lg shadow-lg px-4 py-2 border ${
          darkMode 
            ? 'bg-black/20 border-gray-700' 
            : 'bg-white/20 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <img src={matrixLogo} alt="Matrix AI" className="w-8 h-8 object-contain rounded-lg -my-2" />
                <span className={`font-bold text-xl hidden sm:block ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>matrixai<span className="text-red-500">.</span>asia</span>
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              {/* Tools Dropdown */}
              <div className="relative group" ref={toolsRef}>
                <button 
                  className={`flex items-center transition-colors duration-200 ${
                    darkMode 
                      ? 'text-gray-200 hover:text-white group-hover:text-white' 
                      : 'text-gray-700 hover:text-gray-900 group-hover:text-gray-900'
                  }`}
                >
                  <span>{t('navbar.tools', 'Tools')}</span>
                  <FiChevronDown className={`ml-1 w-4 h-4 transition-transform duration-200 group-hover:rotate-180 ${
                    darkMode ? 'group-hover:text-white' : 'group-hover:text-gray-900'
                  }`} />
                </button>
                
                {/* Tools Dropdown Menu - Now shows on hover with group class */}
                <div className={`absolute left-0 mt-6 w-[400px] rounded-lg shadow-lg backdrop-blur-md border z-50 animate-fadeIn transition-all duration-200 ease-in-out opacity-0 invisible group-hover:opacity-100 group-hover:visible ${
                  darkMode 
                    ? 'bg-black/90 border-gray-700' 
                    : 'bg-white/90 border-gray-200'
                }`}>
                  <div className="py-6 px-4">
                    <div className="flex flex-col space-y-4">
                      <Link to="/tools/image-generator" className={`flex items-center px-6 py-3 text-sm transition-colors duration-150 rounded-md group/item ${
                        darkMode 
                          ? 'text-gray-200 hover:bg-black/50 hover:text-white' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}>
                        <div className={`p-3 rounded-lg mr-4 transition-colors duration-150 ${
                          darkMode 
                            ? 'bg-gray-800/50 group-hover/item:bg-gray-700/50' 
                            : 'bg-gray-200/50 group-hover/item:bg-gray-300/50'
                        }`}>
                          <FiImage className="h-6 w-6 text-gray-300 group-hover/item:text-purple-400 transition-colors duration-150" />
                        </div>
                        <div className="flex-1 whitespace-nowrap">
                          <div className="font-medium text-base">{t('navbar.imageGenerator', 'Image Generator')}</div>
                          <div className={`text-sm ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>{t('navbar.imageGeneratorDesc', 'Create images from text')}</div>
                        </div>
                      </Link>
                      <Link to="/tools/video-creator" className={`flex items-center px-6 py-3 text-sm transition-colors duration-150 rounded-md group/item ${
                        darkMode 
                          ? 'text-gray-200 hover:bg-black/50 hover:text-white' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}>
                        <div className={`p-3 rounded-lg mr-4 transition-colors duration-150 ${
                          darkMode 
                            ? 'bg-gray-800/50 group-hover/item:bg-gray-700/50' 
                            : 'bg-gray-200/50 group-hover/item:bg-gray-300/50'
                        }`}>
                          <FiVideo className="h-6 w-6 text-gray-300 group-hover/item:text-purple-400 transition-colors duration-150" />
                        </div>
                        <div className="flex-1 whitespace-nowrap">
                          <div className="font-medium text-lg">{t('navbar.videoGenerator', 'Video Generator')}</div>
                          <div className={`text-sm ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>{t('navbar.videoGeneratorDesc', 'Create videos from images or text')}</div>
                        </div>
                      </Link>
                      <Link to="/chat" className={`flex items-center px-6 py-3 text-sm transition-colors duration-150 rounded-md group/item ${
                        darkMode 
                          ? 'text-gray-200 hover:bg-black/50 hover:text-white' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}>
                        <div className={`p-3 rounded-lg mr-4 transition-colors duration-150 ${
                          darkMode 
                            ? 'bg-gray-800/50 group-hover/item:bg-gray-700/50' 
                            : 'bg-gray-200/50 group-hover/item:bg-gray-300/50'
                        }`}>
                          <FiMessageSquare className="h-6 w-6 text-gray-300 group-hover/item:text-purple-400 transition-colors duration-150" />
                        </div>
                        <div className="flex-1 whitespace-nowrap">
                          <div className="font-medium text-lg">{t('navbar.aiChat', 'AI Chat')}</div>
                          <div className={`text-sm ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>{t('navbar.aiChatDesc', 'Chat with our advanced AI assistant')}</div>
                        </div>
                      </Link>
                      <Link to="/tools/content-writer" className={`flex items-center px-6 py-3 text-sm transition-colors duration-150 rounded-md group/item ${
                        darkMode 
                          ? 'text-gray-200 hover:bg-black/50 hover:text-white' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}>
                        <div className={`p-3 rounded-lg mr-4 transition-colors duration-150 ${
                          darkMode 
                            ? 'bg-gray-800/50 group-hover/item:bg-gray-700/50' 
                            : 'bg-gray-200/50 group-hover/item:bg-gray-300/50'
                        }`}>
                          <FiEdit3 className="h-6 w-6 text-gray-300 group-hover/item:text-purple-400 transition-colors duration-150" />
                        </div>
                        <div className="flex-1 whitespace-nowrap">
                          <div className="font-medium text-lg">{t('navbar.contentWriter', 'Content Writer')}</div>
                          <div className={`text-sm ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>{t('navbar.contentWriterDesc', 'Generate professional content')}</div>
                        </div>
                      </Link>
                      <Link to="/tools/speech-to-text" className={`flex items-center px-6 py-3 text-sm transition-colors duration-150 rounded-md group/item ${
                        darkMode 
                          ? 'text-gray-200 hover:bg-black/50 hover:text-white' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}>
                        <div className={`p-3 rounded-lg mr-4 transition-colors duration-150 ${
                          darkMode 
                            ? 'bg-gray-800/50 group-hover/item:bg-gray-700/50' 
                            : 'bg-gray-200/50 group-hover/item:bg-gray-300/50'
                        }`}>
                          <FiMic className="h-6 w-6 text-gray-300 group-hover/item:text-purple-400 transition-colors duration-150" />
                        </div>
                        <div className="flex-1 whitespace-nowrap">
                          <div className="font-medium text-lg">{t('navbar.speechToText', 'Speech to Text')}</div>
                          <div className={`text-sm ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>{t('navbar.speechToTextDesc', 'Convert audio to text')}</div>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Resources Dropdown */}
              <div className="relative group" ref={resourcesRef}>
                <button 
                  className={`flex items-center transition-colors duration-200 ${
                    darkMode 
                      ? 'text-gray-200 hover:text-white group-hover:text-white' 
                      : 'text-gray-700 hover:text-gray-900 group-hover:text-gray-900'
                  }`}
                >
                  <span>{t('navbar.resources', 'Resources')}</span>
                  <FiChevronDown className={`ml-1 w-4 h-4 transition-transform duration-200 group-hover:rotate-180 ${
                    darkMode ? 'group-hover:text-white' : 'group-hover:text-gray-900'
                  }`} />
                </button>
                
                {/* Resources Dropdown Menu - Now shows on hover with group class */}
                <div className={`absolute left-0 mt-6 w-[400px] rounded-lg shadow-lg backdrop-blur-md border z-50 animate-fadeIn transition-all duration-200 ease-in-out opacity-0 invisible group-hover:opacity-100 group-hover:visible ${
                  darkMode 
                    ? 'bg-black/90 border-gray-700' 
                    : 'bg-white/90 border-gray-200'
                }`}>
                  <div className="py-6 px-4">
                    <div className="flex flex-col space-y-4">
                      <Link to="/blog" className={`flex items-center px-6 py-3 text-sm transition-colors duration-150 rounded-md group/item ${
                        darkMode 
                          ? 'text-gray-200 hover:bg-black/50 hover:text-white' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}>
                        <div className={`p-3 rounded-lg mr-4 transition-colors duration-150 ${
                          darkMode 
                            ? 'bg-gray-800/50 group-hover/item:bg-gray-700/50' 
                            : 'bg-gray-200/50 group-hover/item:bg-gray-300/50'
                        }`}>
                          <FiFileText className="h-6 w-6 text-gray-300 group-hover/item:text-purple-400 transition-colors duration-150" />
                        </div>
                        <div className="flex-1 whitespace-nowrap">
                          <div className="font-medium text-lg">{t('navbar.blog', 'Blog')}</div>
                          <div className={`text-sm ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>{t('navbar.blogDesc', 'Latest news & updates')}</div>
                        </div>
                      </Link>
                      <Link to="/about" className={`flex items-center px-6 py-3 text-sm transition-colors duration-150 rounded-md group/item ${
                        darkMode 
                          ? 'text-gray-200 hover:bg-black/50 hover:text-white' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}>
                        <div className={`p-3 rounded-lg mr-4 transition-colors duration-150 ${
                          darkMode 
                            ? 'bg-gray-800/50 group-hover/item:bg-gray-700/50' 
                            : 'bg-gray-200/50 group-hover/item:bg-gray-300/50'
                        }`}>
                          <FiUsers className="h-6 w-6 text-gray-300 group-hover/item:text-purple-400 transition-colors duration-150" />
                        </div>
                        <div className="flex-1 whitespace-nowrap">
                          <div className="font-medium text-lg">{t('navbar.aboutUs', 'About Us')}</div>
                          <div className={`text-sm ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>{t('navbar.aboutUsDesc', 'Learn about our company')}</div>
                        </div>
                      </Link>
                      <Link to="/faq" className={`flex items-center px-6 py-3 text-sm transition-colors duration-150 rounded-md group/item ${
                        darkMode 
                          ? 'text-gray-200 hover:bg-black/50 hover:text-white' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}>
                        <div className={`p-3 rounded-lg mr-4 transition-colors duration-150 ${
                          darkMode 
                            ? 'bg-gray-800/50 group-hover/item:bg-gray-700/50' 
                            : 'bg-gray-200/50 group-hover/item:bg-gray-300/50'
                        }`}>
                          <FiHelpCircle className="h-6 w-6 text-gray-300 group-hover/item:text-purple-400 transition-colors duration-150" />
                        </div>
                        <div className="flex-1 whitespace-nowrap">
                          <div className="font-medium text-lg">{t('navbar.faq', 'FAQ')}</div>
                          <div className={`text-sm ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>{t('navbar.faqDesc', 'Frequently asked questions')}</div>
                        </div>
                      </Link>
                      <Link to="/contact" className={`flex items-center px-6 py-3 text-sm transition-colors duration-150 rounded-md group/item ${
                        darkMode 
                          ? 'text-gray-200 hover:bg-black/50 hover:text-white' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}>
                        <div className={`p-3 rounded-lg mr-4 transition-colors duration-150 ${
                          darkMode 
                            ? 'bg-gray-800/50 group-hover/item:bg-gray-700/50' 
                            : 'bg-gray-200/50 group-hover/item:bg-gray-300/50'
                        }`}>
                          <FiHelpCircle className="h-6 w-6 text-gray-300 group-hover/item:text-purple-400 transition-colors duration-150" />
                        </div>
                        <div className="flex-1 whitespace-nowrap">
                          <div className="font-medium text-lg">{t('navbar.contact', 'Contact')}</div>
                          <div className={`text-sm ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>{t('navbar.contactDesc', 'Get in touch with us')}</div>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Download App Dropdown */}
              <div className="relative group">
                <button 
                  className={`flex items-center transition-colors duration-200 ${
                    darkMode 
                      ? 'text-gray-200 hover:text-white group-hover:text-white' 
                      : 'text-gray-700 hover:text-gray-900 group-hover:text-gray-900'
                  }`}
                >
                  <span>{t('navbar.downloadApp', 'Download App')}</span>
                  <FiChevronDown className={`ml-1 w-4 h-4 transition-transform duration-200 group-hover:rotate-180 ${
                    darkMode ? 'group-hover:text-white' : 'group-hover:text-gray-900'
                  }`} />
                </button>
                
                {/* Download App Dropdown Menu */}
                <div className={`absolute left-0 mt-6 w-[250px] rounded-lg shadow-lg backdrop-blur-md z-50 animate-fadeIn transition-all duration-200 ease-in-out opacity-0 invisible group-hover:opacity-100 group-hover:visible ${
                  darkMode 
                    ? 'bg-black/90 border border-gray-700' 
                    : 'bg-white/90 border border-gray-200'
                }`}>
                  <div className="py-4 px-4">
                    <div className="flex flex-col space-y-2">
                      <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer" className={`flex items-center px-4 py-3 text-sm transition-colors duration-150 rounded-md group/item ${
                        darkMode 
                          ? 'text-gray-200 hover:bg-black/50 hover:text-white' 
                          : 'text-gray-700 hover:bg-gray-100/50 hover:text-gray-900'
                      }`}>
                        <div className={`p-2 rounded-lg mr-3 transition-colors duration-150 ${
                          darkMode 
                            ? 'bg-gray-800/50 group-hover/item:bg-gray-700/50' 
                            : 'bg-gray-200/50 group-hover/item:bg-gray-300/50'
                        }`}>
                          <FiDownload className="h-5 w-5 text-gray-300 group-hover/item:text-purple-400 transition-colors duration-150" />
                        </div>
                        <div className="flex-1 whitespace-nowrap">
                          <div className="font-medium">{t('navbar.iosAppStore', 'iOS App Store')}</div>
                        </div>
                      </a>
                      <a href="https://play.google.com" target="_blank" rel="noopener noreferrer" className={`flex items-center px-4 py-3 text-sm transition-colors duration-150 rounded-md group/item ${
                        darkMode 
                          ? 'text-gray-200 hover:bg-black/50 hover:text-white' 
                          : 'text-gray-700 hover:bg-gray-100/50 hover:text-gray-900'
                      }`}>
                        <div className={`p-2 rounded-lg mr-3 transition-colors duration-150 ${
                          darkMode 
                            ? 'bg-gray-800/50 group-hover/item:bg-gray-700/50' 
                            : 'bg-gray-200/50 group-hover/item:bg-gray-300/50'
                        }`}>
                          <FiDownload className="h-5 w-5 text-gray-300 group-hover/item:text-purple-400 transition-colors duration-150" />
                        </div>
                        <div className="flex-1 whitespace-nowrap">
                          <div className="font-medium">{t('navbar.googlePlayStore', 'Google Play Store')}</div>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <Link to="/pricing" className={`transition-colors duration-200 ${
                darkMode 
                  ? 'text-gray-200 hover:text-white' 
                  : 'text-gray-700 hover:text-gray-900'
              }`}>{t('navbar.pricing', 'Pricing')}</Link>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-4">
              <SimpleLanguageSelector />
              <Link to="/login" className={`hidden md:block transition-colors duration-200 text-sm md:text-base ${
                darkMode 
                  ? 'text-gray-200 hover:text-white' 
                  : 'text-gray-700 hover:text-gray-900'
              }`}>{t('navbar.login', 'Log in')}</Link>
              <Link 
                to="/signup" 
                className="inline-flex items-center px-2 py-1.5 md:px-4 md:py-2 rounded-lg font-medium text-xs md:text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-300"
              >
                <span className="hidden sm:inline">{t('navbar.getStarted', 'Get started now')}</span>
                <span className="sm:hidden">{t('navbar.signUp', 'Sign up')}</span>
                <FiArrowRight className="ml-1 md:ml-2 w-3 h-3 md:w-4 md:h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default HomeNavbar;