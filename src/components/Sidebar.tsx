import React, { useState, useContext, useRef, useEffect } from 'react';
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
  FiUser,
  FiMic,
  FiUpload,
  FiPlay,
  FiPause,
  FiX,
  FiCheck,
  FiShoppingBag,
  FiShield
} from 'react-icons/fi';
import { ThemeContext } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  onToggle?: (collapsed: boolean) => void;
  activeLink?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onToggle, activeLink }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  const { userData, isPro } = useUser();
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  
  // Speech to text state
  const [showSpeechToTextModal, setShowSpeechToTextModal] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleSidebar = () => {
    const newCollapsedState = !collapsed;
    setCollapsed(newCollapsedState);
    if (onToggle) {
      onToggle(newCollapsedState);
    }
  };

  // Call onToggle on initial render with the current state
  useEffect(() => {
    if (onToggle) {
      onToggle(collapsed);
    }
  }, [collapsed, onToggle]);

  const isActive = (path: string) => {
    if (activeLink) {
      // Check if the activeLink matches the path or if the path is a prefix of activeLink
      return activeLink === path || (path !== '/' && activeLink.startsWith(path));
    }
    return location.pathname === path;
  };

  // Speech to text functions
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setAudioFile(file);
    
    // Create audio preview
    createAudioPreview(file);
  };
  
  const createAudioPreview = (file: File) => {
    const audioURL = URL.createObjectURL(file);
    setAudioPreview(audioURL);
    
    // Clean up the URL when component unmounts
    return () => {
      URL.revokeObjectURL(audioURL);
    };
  };
  
  const toggleAudioPreview = () => {
    if (audioPreviewRef.current) {
      if (isAudioPlaying) {
        audioPreviewRef.current.pause();
      } else {
        audioPreviewRef.current.play();
      }
      setIsAudioPlaying(!isAudioPlaying);
    }
  };
  
  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setAudioFile(file);
      createAudioPreview(file);
    }
  };
  
  const handleProcessSpeechToText = () => {
    if (audioFile) {
      // Navigate to the speech-to-text page
      navigate('/tools/speech-to-text');
      setShowSpeechToTextModal(false);
      setAudioFile(null);
      setAudioPreview(null);
    }
  };

  const openSpeechToTextModal = () => {
    setShowSpeechToTextModal(true);
  };

  // Navigation items
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <FiHome className="w-5 h-5" /> },
    { path: '/chat', label: 'AI Chat', icon: <FiMessageSquare className="w-5 h-5" />, pro: true },
    { path: '/tools/image-generator', label: 'Image Generator', icon: <FiImage className="w-5 h-5" />, pro: true },
    { path: '/tools/video-creator', label: 'Video Creator', icon: <FiVideo className="w-5 h-5" />, pro: true },
    { path: '/tools/content-writer', label: 'Content Writer', icon: <FiFileText className="w-5 h-5" />, pro: true },
    // { path: '/tools/humanise-text', label: 'Humanise Text', icon: <FiUser className="w-5 h-5" />, pro: true },
    // { path: '/tools/detect-ai', label: 'AI Detector', icon: <FiShield className="w-5 h-5" />, pro: true },
    // { path: '/tools/presentation-creator', label: 'Presentations', icon: <FiLayers className="w-5 h-5" />, pro: true },
    { path: '/tools/speech-to-text', label: 'Speech to Text', icon: <FiMic className="w-5 h-5" />, pro: true },
    { path: '/profile', label: 'Profile', icon: <FiUser className="w-5 h-5" /> },
    { path: '/settings', label: 'Settings', icon: <FiSettings className="w-5 h-5" /> },
    { path: '/help', label: 'Help & Support', icon: <FiHelpCircle className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Sidebar Container */}
      <aside
        className={`fixed h-screen transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        } ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        } border-r left-0 top-0 z-40 overflow-hidden`}
        style={{ position: 'fixed' }}
      >
        <div className="flex flex-col h-full">
          {/* Logo and Toggle Section */}
          <div className="flex-shrink-0 px-3 py-4">
            <div className="flex items-center justify-between mb-8 px-2">
              {!collapsed && (
                <Link to="/dashboard" className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    MA
                  </div>
                  <div className="flex items-center">
                    <span className="ml-2 text-lg font-bold">MatrixAI</span>
                    {isPro && (
                      <span className="ml-1 text-xs font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 text-transparent bg-clip-text border border-yellow-400 rounded-full px-2 py-0.5">
                        PRO
                      </span>
                    )}
                  </div>
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
          </div>

          {/* Navigation Links Section - Scrollable but contained within sidebar */}
          <div className="flex-1 px-3 overflow-y-auto max-h-[calc(100vh-180px)]">
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
                    {!collapsed && (
                      <div className="flex items-center justify-between w-full">
                        <span className="ml-3">{item.label}</span>
                        {item.pro && !isPro && (
                          <span className="text-xs font-semibold text-yellow-500 border border-yellow-400 rounded-full px-1.5">
                            PRO
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Quick Speech to Text Button */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={openSpeechToTextModal}
                className={`p-3 rounded-full ${
                  collapsed ? 'mx-auto' : 'w-full'
                } ${
                  darkMode 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90'
                }`}
                title="Quick Speech to Text"
              >
                <div className={`flex items-center ${collapsed ? 'justify-center' : ''}`}>
                  <FiMic className="w-5 h-5" />
                  {!collapsed && <span className="ml-2">Quick Speech to Text</span>}
                </div>
              </button>
            </div>
          </div>

          {/* Footer Section - Fixed at Bottom */}
          <div className="flex-shrink-0 px-3 py-4 border-t border-gray-200 dark:border-gray-700">
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
      
      {/* Speech to Text Modal */}
      <AnimatePresence>
        {showSpeechToTextModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSpeechToTextModal(false)}
          >
            <motion.div
              className={`${
                darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
              } w-full max-w-md rounded-2xl shadow-xl overflow-hidden`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <FiMic className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">MatrixAI Speech to Text</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Convert audio to text quickly and accurately
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSpeechToTextModal(false)}
                  className={`rounded-full p-1 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <FiX />
                </button>
              </div>
              
              {/* Body */}
              <div className="p-6">
                {!audioFile ? (
                  <div 
                    className={`border-2 border-dashed rounded-xl p-8 transition-all ${
                      darkMode ? 'border-gray-700 hover:border-blue-500' : 'border-gray-300 hover:border-blue-500'
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 bg-opacity-10 dark:bg-opacity-20">
                        <FiUpload className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">
                        Drag & drop your audio file here
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                        WAV, MP3, MP4, M4A, AAC, OGG, FLAC
                      </p>
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="audio/*"
                          onChange={handleFileChange}
                          className="hidden"
                          id="speech-file-upload"
                        />
                        <label
                          htmlFor="speech-file-upload"
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 cursor-pointer shadow-md hover:shadow-lg transition-all inline-flex items-center"
                        >
                          <FiUpload className="mr-2" />
                          Browse Files
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                      <FiCheck className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      File selected
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {audioFile.name}
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 mb-4">
                      {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    
                    {audioPreview && (
                      <div className="mb-4 flex items-center space-x-3">
                        <button
                          onClick={toggleAudioPreview}
                          className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                          {isAudioPlaying ? <FiPause /> : <FiPlay />}
                        </button>
                        <span className="text-gray-600 dark:text-gray-400 text-sm">
                          {isAudioPlaying ? 'Pause preview' : 'Play preview'}
                        </span>
                        <audio 
                          ref={audioPreviewRef}
                          src={audioPreview} 
                          onEnded={() => setIsAudioPlaying(false)}
                          className="hidden" 
                        />
                      </div>
                    )}
                    
                    <div className="flex space-x-3 mt-4">
                      <button
                        onClick={() => {
                          setAudioFile(null);
                          setAudioPreview(null);
                        }}
                        className={`px-4 py-2 rounded-md ${
                          darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleProcessSpeechToText}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:opacity-90"
                      >
                        Process Audio
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar; 