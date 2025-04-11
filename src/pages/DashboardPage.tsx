import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiMessageSquare, 
  FiImage,
  FiVideo,
  FiFileText,
  FiBarChart2,
  FiPenTool,
  FiLayers,
  FiCpu,
  FiStar,
  FiPlus,
  FiUser,
  FiSettings,
  FiClock,
  FiMic
} from 'react-icons/fi';
import { ThemeContext } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';

// Sample data for the dashboard
const mockRecentProjects = [
  { 
    id: 1, 
    title: 'Futuristic City Skyline', 
    type: 'Image', 
    date: '2 hours ago',
    preview: '/assets/preview-image-1.jpg',
    icon: <FiImage className="h-4 w-4" />
  },
  { 
    id: 2, 
    title: 'Product Explainer Video', 
    type: 'Video', 
    date: '5 hours ago',
    preview: '/assets/preview-video-1.jpg',
    icon: <FiVideo className="h-4 w-4" />
  },
  { 
    id: 3, 
    title: 'Marketing Campaign Copy', 
    type: 'Text', 
    date: 'Yesterday',
    preview: '',
    icon: <FiFileText className="h-4 w-4" />
  },
];

const mockStats = {
  totalProjects: 42,
  projectsThisWeek: 12,
  favoriteType: 'Image',
  storageUsed: '2.4 GB'
};

const AIToolSection = ({ title, icon, description, color, route }: { 
  title: string, 
  icon: React.ReactNode, 
  description: string, 
  color: string,
  route: string
}) => {
  const { darkMode } = useContext(ThemeContext);

  return (
    <Link to={route} className="block group">
      <div className={`h-full rounded-xl p-6 transition-all duration-300 ${
        darkMode 
          ? 'bg-gray-800/50 hover:bg-gray-800/80 border border-gray-700/50' 
          : 'bg-white hover:bg-white/80 border border-gray-100'
      } hover:shadow-lg`}>
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center mb-4`}>
          {icon}
        </div>
        <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>
        <div className={`mt-4 text-sm font-medium ${
          darkMode ? 'text-blue-400' : 'text-blue-600'
        } flex items-center group-hover:underline`}>
          Get started
          <svg className="ml-1 w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </Link>
  );
};

const DashboardPage: React.FC = () => {
  const { darkMode } = useContext(ThemeContext);
  const { userData } = useUser();
  const [currentDate] = useState(new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }));

  return (
    <div className={`py-8 px-4 lg:px-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Background gradient effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 blur-3xl opacity-70"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-purple-500/10 via-pink-500/5 to-blue-500/10 blur-3xl opacity-70"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start mb-8 gap-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Welcome, {userData?.name?.split(' ')[0] || 'User'}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}
            >
              {currentDate} • Your AI creative workspace
            </motion.p>
          </div>

        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex gap-3"
        >
            <Link to="/profile" className={`p-2 rounded-lg flex items-center ${
              darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-white hover:bg-gray-100 text-gray-700'
            } transition-colors`}>
              <FiUser className="h-5 w-5" />
            </Link>
            <Link to="/settings" className={`p-2 rounded-lg flex items-center ${
              darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-white hover:bg-gray-100 text-gray-700'
            } transition-colors`}>
              <FiSettings className="h-5 w-5" />
            </Link>
            <Link 
              to="/new-project" 
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                darkMode
                  ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white'
                  : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white'
              }`}
            >
              <FiPlus className="h-4 w-4" />
              <span>New Project</span>
            </Link>
          </motion.div>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {[
            { 
              title: "Total Projects", 
              value: mockStats.totalProjects, 
              icon: <FiLayers size={18} />, 
              change: "+12%", 
              color: darkMode ? "from-blue-600/20 to-blue-800/20" : "from-blue-500/20 to-blue-600/20",
              textColor: darkMode ? "text-blue-400" : "text-blue-600" 
            },
            { 
              title: "New This Week", 
              value: mockStats.projectsThisWeek, 
              icon: <FiBarChart2 size={18} />, 
              change: "+8%", 
              color: darkMode ? "from-purple-600/20 to-purple-800/20" : "from-purple-500/20 to-purple-600/20",
              textColor: darkMode ? "text-purple-400" : "text-purple-600"
            },
            { 
              title: "Favorite Type", 
              value: mockStats.favoriteType, 
              icon: <FiStar size={18} />, 
              color: darkMode ? "from-pink-600/20 to-pink-800/20" : "from-pink-500/20 to-pink-600/20",
              textColor: darkMode ? "text-pink-400" : "text-pink-600"
            },
            { 
              title: "Storage Used", 
              value: mockStats.storageUsed, 
              icon: <FiClock size={18} />, 
              change: "of 10 GB", 
              color: darkMode ? "from-cyan-600/20 to-cyan-800/20" : "from-cyan-500/20 to-cyan-600/20", 
              textColor: darkMode ? "text-cyan-400" : "text-cyan-600"
            }
          ].map((stat, index) => (
        <motion.div 
              key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`rounded-xl p-5 ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700/50' 
                  : 'bg-white border border-gray-100'
              }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-medium`}>{stat.title}</span>
                  <span className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</span>
            </div>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center ${stat.textColor}`}>
                  {stat.icon}
            </div>
          </div>
              {stat.change && (
                <div className={`mt-3 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center`}>
                  <span className={stat.textColor}>{stat.change}</span>
                  {stat.title !== "Storage Used" && <span className="ml-1">from last week</span>}
          </div>
              )}
        </motion.div>
          ))}
        </div>

        {/* AI Tools Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              AI Tools
            </h2>
            <Link to="/tools" className={`text-sm flex items-center ${
              darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
            }`}>
              View all tools
              <svg className="ml-1 w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AIToolSection 
              title="Image Generator" 
              icon={<FiImage className="text-white text-xl" />} 
              description="Create stunning, unique images from text descriptions." 
              color="bg-gradient-to-r from-blue-500 to-indigo-600"
              route="/tools/image-generator"
            />
            
            <AIToolSection 
              title="Video Creator" 
              icon={<FiVideo className="text-white text-xl" />} 
              description="Transform images and text into captivating videos." 
              color="bg-gradient-to-r from-purple-500 to-pink-600"
              route="/tools/video-creator"
            />
            
            <AIToolSection 
              title="Chat Assistant" 
              icon={<FiMessageSquare className="text-white text-xl" />} 
              description="Get answers, ideas, and assistance through natural conversation." 
              color="bg-gradient-to-r from-blue-500 to-cyan-500"
              route="/chat"
            />
            
            <AIToolSection 
              title="Content Writer" 
              icon={<FiFileText className="text-white text-xl" />} 
              description="Generate high-quality articles, blog posts, and copy." 
              color="bg-gradient-to-r from-green-500 to-emerald-600"
              route="/tools/content-writer"
            />
            
            <AIToolSection 
              title="Image Editor" 
              icon={<FiPenTool className="text-white text-xl" />} 
              description="Edit and enhance your images with AI-powered tools." 
              color="bg-gradient-to-r from-orange-500 to-pink-500"
              route="/tools/image-editor"
            />
            
            <AIToolSection 
              title="Presentation Creator" 
              icon={<FiLayers className="text-white text-xl" />} 
              description="Create professional presentations from simple text prompts." 
              color="bg-gradient-to-r from-purple-600 to-indigo-600"
              route="/tools/presentation-creator"
            />

            <AIToolSection 
              title="Speech to Text" 
              icon={<FiMic className="text-white text-xl" />} 
              description="Convert audio files to accurate text transcriptions." 
              color="bg-gradient-to-r from-pink-500 to-red-600"
              route="/tools/speech-to-text"
            />
          </div>
        </motion.div>

        {/* Recent Projects */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Recent Projects
            </h2>
            <Link to="/projects" className={`text-sm flex items-center ${
              darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
            }`}>
              View all projects
              <svg className="ml-1 w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            {mockRecentProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.7 + (index * 0.1) }}
              >
                <Link 
                  to={`/projects/${project.id}`} 
                  className={`block rounded-xl overflow-hidden ${
                    darkMode 
                      ? 'bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800' 
                      : 'bg-white border border-gray-100 hover:bg-gray-50'
                  } transition-colors`}
                >
                  {project.type === 'Image' && (
                    <div className="aspect-video w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-white">Image Preview</span>
                    </div>
                  )}
                  {project.type === 'Video' && (
                    <div className="aspect-video w-full bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center">
                      <span className="text-white">Video Preview</span>
                    </div>
                  )}
                  {project.type === 'Text' && (
                    <div className="aspect-video w-full bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center">
                      <span className="text-white">Text Content</span>
                  </div>
                  )}
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{project.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.type === 'Image' 
                          ? 'bg-blue-100 text-blue-700' 
                          : project.type === 'Video'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-green-100 text-green-700'
                      } ${darkMode ? 'opacity-80' : ''}`}>
                        {project.type}
                      </span>
                    </div>
                    <div className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{project.date}</div>
                  </div>
              </Link>
              </motion.div>
            ))}
          </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 1.0 }}
            className={`rounded-xl p-5 text-center ${
              darkMode 
                ? 'bg-gray-800/30 border border-gray-700/30 hover:bg-gray-800/50' 
                : 'bg-gray-50 border border-gray-100 hover:bg-gray-100'
            } transition-colors cursor-pointer`}
            >
            <Link to="/new-project" className="block">
              <div className="flex flex-col items-center justify-center py-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                }`}>
                  <FiPlus className="h-5 w-5" />
                </div>
                <h3 className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Create New Project</h3>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Start a fresh AI-powered creation</p>
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage; 