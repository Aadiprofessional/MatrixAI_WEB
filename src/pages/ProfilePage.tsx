import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import { Layout } from '../components';
import { 
  FiEdit2, 
  FiUser, 
  FiMail, 
  FiLock, 
  FiCalendar, 
  FiClock,
  FiImage,
  FiVideo,
  FiFileText,
  FiMessageSquare,
  FiUpload,
  FiSave
} from 'react-icons/fi';

// Mock user data
const userData = {
  name: "Aadi Srivastava",
  email: "aadi@example.com",
  avatar: "",
  joinDate: "July 2023",
  plan: "Pro",
  usage: {
    images: 253,
    videos: 42,
    documents: 147,
    chats: 358
  },
  activity: [
    { type: "image", text: "Created an image 'Futuristic city skyline'", time: "2 hours ago" },
    { type: "chat", text: "Started a new chat about 'Quantum computing'", time: "5 hours ago" },
    { type: "document", text: "Generated an article about 'AI trends in 2023'", time: "Yesterday" },
    { type: "video", text: "Created a video explaining 'Neural networks'", time: "2 days ago" },
    { type: "image", text: "Created an image 'Abstract art in blue'", time: "3 days ago" }
  ]
};

const ActivityItem = ({ item }: { item: { type: string, text: string, time: string } }) => {
  const { darkMode } = useContext(ThemeContext);
  
  const getIcon = (type: string) => {
    switch(type) {
      case 'image':
        return <FiImage className="w-4 h-4" />;
      case 'video':
        return <FiVideo className="w-4 h-4" />;
      case 'document':
        return <FiFileText className="w-4 h-4" />;
      case 'chat':
        return <FiMessageSquare className="w-4 h-4" />;
      default:
        return <FiClock className="w-4 h-4" />;
    }
  };

  const getColor = (type: string) => {
    switch(type) {
      case 'image':
        return darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-600';
      case 'video':
        return darkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-600';
      case 'document':
        return darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-600';
      case 'chat':
        return darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-600';
      default:
        return darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className={`p-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'} border-b last:border-b-0`}>
      <div className="flex items-start">
        <div className={`p-2 rounded-lg mr-3 ${getColor(item.type)}`}>
          {getIcon(item.type)}
        </div>
        <div>
          <p className={darkMode ? 'text-white' : 'text-gray-800'}>{item.text}</p>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>{item.time}</p>
        </div>
      </div>
    </div>
  );
};

const ProfilePage: React.FC = () => {
  const { darkMode } = useContext(ThemeContext);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: userData.name,
    email: userData.email,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would submit the changes to an API
    setIsEditing(false);
  };

  return (
    <Layout>
      <div className={`py-8 px-4 lg:px-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Background gradient effects */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 blur-3xl opacity-70"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-purple-500/10 via-pink-500/5 to-blue-500/10 blur-3xl opacity-70"></div>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Your Profile
            </h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              Manage your account settings and preferences
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className={`rounded-xl ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700/50' 
                  : 'bg-white border border-gray-100'
              } p-6 lg:col-span-1`}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 relative">
                  {userData.avatar ? (
                    <img 
                      src={userData.avatar} 
                      alt={userData.name} 
                      className="rounded-full object-cover w-full h-full"
                    />
                  ) : (
                    <div className={`w-full h-full rounded-full flex items-center justify-center text-2xl font-bold ${
                      darkMode 
                        ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white' 
                        : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white'
                    }`}>
                      {userData.name.charAt(0)}
                    </div>
                  )}
                  <button 
                    className={`absolute bottom-0 right-0 p-2 rounded-full ${
                      darkMode ? 'bg-gray-700 text-blue-400' : 'bg-white text-blue-600'
                    } border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
                  >
                    <FiEdit2 size={14} />
                  </button>
                </div>

                <h2 className={`text-xl font-bold mt-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {userData.name}
                </h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {userData.email}
                </p>
                
                <div className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                  darkMode 
                    ? 'bg-blue-900/30 text-blue-300' 
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  {userData.plan} Plan
                </div>
                
                <div className="w-full mt-6 pt-6 border-t border-dashed border-opacity-50 border-gray-500">
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Member since {userData.joinDate}
                  </p>
                </div>
              </div>

              {/* Usage Stats */}
              <div className="mt-6">
                <h3 className={`text-md font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Your Usage
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Images', value: userData.usage.images, icon: <FiImage className="w-4 h-4" /> },
                    { label: 'Videos', value: userData.usage.videos, icon: <FiVideo className="w-4 h-4" /> },
                    { label: 'Documents', value: userData.usage.documents, icon: <FiFileText className="w-4 h-4" /> },
                    { label: 'Chats', value: userData.usage.chats, icon: <FiMessageSquare className="w-4 h-4" /> }
                  ].map((item, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-50'
                      } flex flex-col`}
                    >
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        {item.icon}
                        <span className={`ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.label}</span>
                      </div>
                      <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Profile Settings */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className={`rounded-xl ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700/50' 
                  : 'bg-white border border-gray-100'
              } p-6 lg:col-span-2`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Account Settings
                </h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    isEditing 
                      ? (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')
                      : (darkMode ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600' : 'text-white bg-gradient-to-r from-blue-500 to-purple-500')
                  }`}
                >
                  {isEditing ? (
                    <>
                      <FiSave className="mr-2" />
                      <span>Save</span>
                    </>
                  ) : (
                    <>
                      <FiEdit2 className="mr-2" />
                      <span>Edit Profile</span>
                    </>
                  )}
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-5">
                  <div>
                    <label 
                      htmlFor="name" 
                      className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Full Name
                    </label>
                    <div className="flex items-center">
                      <span className={`p-2 ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'} rounded-l-lg`}>
                        <FiUser className="w-5 h-5" />
                      </span>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        disabled={!isEditing}
                        value={formData.name}
                        onChange={handleChange}
                        className={`flex-1 p-2 ${
                          darkMode 
                            ? 'bg-gray-700 text-white border-gray-600' 
                            : 'bg-white text-gray-900 border-gray-300'
                        } border rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          !isEditing ? (darkMode ? 'opacity-70' : 'bg-gray-50') : ''
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label 
                      htmlFor="email" 
                      className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Email Address
                    </label>
                    <div className="flex items-center">
                      <span className={`p-2 ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'} rounded-l-lg`}>
                        <FiMail className="w-5 h-5" />
                      </span>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        disabled={!isEditing}
                        value={formData.email}
                        onChange={handleChange}
                        className={`flex-1 p-2 ${
                          darkMode 
                            ? 'bg-gray-700 text-white border-gray-600' 
                            : 'bg-white text-gray-900 border-gray-300'
                        } border rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          !isEditing ? (darkMode ? 'opacity-70' : 'bg-gray-50') : ''
                        }`}
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <>
                      <div className={`w-full h-px my-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                      
                      <div>
                        <label 
                          htmlFor="currentPassword" 
                          className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          Current Password
                        </label>
                        <div className="flex items-center">
                          <span className={`p-2 ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'} rounded-l-lg`}>
                            <FiLock className="w-5 h-5" />
                          </span>
                          <input
                            type="password"
                            id="currentPassword"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleChange}
                            className={`flex-1 p-2 ${
                              darkMode 
                                ? 'bg-gray-700 text-white border-gray-600' 
                                : 'bg-white text-gray-900 border-gray-300'
                            } border rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                          />
                        </div>
                      </div>

                      <div>
                        <label 
                          htmlFor="newPassword" 
                          className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          New Password
                        </label>
                        <div className="flex items-center">
                          <span className={`p-2 ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'} rounded-l-lg`}>
                            <FiLock className="w-5 h-5" />
                          </span>
                          <input
                            type="password"
                            id="newPassword"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            className={`flex-1 p-2 ${
                              darkMode 
                                ? 'bg-gray-700 text-white border-gray-600' 
                                : 'bg-white text-gray-900 border-gray-300'
                            } border rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                          />
                        </div>
                      </div>

                      <div>
                        <label 
                          htmlFor="confirmPassword" 
                          className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          Confirm New Password
                        </label>
                        <div className="flex items-center">
                          <span className={`p-2 ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'} rounded-l-lg`}>
                            <FiLock className="w-5 h-5" />
                          </span>
                          <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={`flex-1 p-2 ${
                              darkMode 
                                ? 'bg-gray-700 text-white border-gray-600' 
                                : 'bg-white text-gray-900 border-gray-300'
                            } border rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {isEditing && (
                    <button 
                      type="submit"
                      className={`w-full py-2.5 rounded-lg mt-6 ${
                        darkMode
                          ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white'
                          : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white'
                      }`}
                    >
                      Save Changes
                    </button>
                  )}
                </div>
              </form>
            </motion.div>

            {/* Recent Activity */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className={`rounded-xl ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700/50' 
                  : 'bg-white border border-gray-100'
              } lg:col-span-3`}
            >
              <div className="px-6 py-4 border-b border-gray-700">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Recent Activity
                </h2>
              </div>
              <div className="divide-y divide-gray-700">
                {userData.activity.map((item, index) => (
                  <ActivityItem key={index} item={item} />
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage; 