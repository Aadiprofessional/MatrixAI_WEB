import React, { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import { Layout } from '../components';
import { 
  FiMoon, 
  FiSun, 
  FiBell, 
  FiLock, 
  FiGlobe, 
  FiDatabase,
  FiDownload,
  FiToggleLeft,
  FiToggleRight,
  FiCheck,
  FiX,
  FiShield,
  FiSave,
  FiAlertCircle
} from 'react-icons/fi';

// Toggle component
const ToggleSwitch = ({ isEnabled, toggleFunction, label, description }: { 
  isEnabled: boolean;
  toggleFunction: () => void;
  label: string;
  description?: string;
}) => {
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <div className="flex justify-between items-center py-4">
      <div>
        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {label}
        </p>
        {description && (
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            {description}
          </p>
        )}
      </div>
      <button 
        onClick={toggleFunction}
        className="flex-shrink-0 group"
        aria-checked={isEnabled}
        role="switch"
      >
        <span className={`flex items-center h-7 w-14 rounded-full transition-colors ${
          isEnabled 
            ? (darkMode ? 'bg-blue-600' : 'bg-blue-600') 
            : (darkMode ? 'bg-gray-700' : 'bg-gray-300')
        }`}>
          <span className={`flex items-center justify-center w-5 h-5 transform transition-transform mx-1 rounded-full ${
            isEnabled ? 'translate-x-7 bg-white' : 'translate-x-0 bg-white'
          }`}>
            {isEnabled ? (
              <FiCheck className="h-3 w-3 text-blue-600" />
            ) : (
              <FiX className="h-3 w-3 text-gray-400" />
            )}
          </span>
        </span>
      </button>
    </div>
  );
};

// Select Option component
const SelectOption = ({ 
  options, 
  selectedValue, 
  onChange,
  label
}: { 
  options: {value: string, label: string}[];
  selectedValue: string;
  onChange: (value: string) => void;
  label: string;
}) => {
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <div className="py-4">
      <label className={`block font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {label}
      </label>
      <select 
        value={selectedValue}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-2.5 rounded-lg border ${
          darkMode 
            ? 'bg-gray-700 border-gray-600 text-white' 
            : 'bg-white border-gray-300 text-gray-900'
        } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// Notification Toast component
const NotificationToast = ({ message, type, onClose }: { 
  message: string; 
  type: 'success' | 'error' | 'warning'; 
  onClose: () => void;
}) => {
  const { darkMode } = useContext(ThemeContext);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const getBgColor = () => {
    switch(type) {
      case 'success':
        return darkMode ? 'bg-green-900/70' : 'bg-green-100';
      case 'error':
        return darkMode ? 'bg-red-900/70' : 'bg-red-100';
      case 'warning':
        return darkMode ? 'bg-yellow-900/70' : 'bg-yellow-100';
      default:
        return darkMode ? 'bg-gray-800' : 'bg-gray-100';
    }
  };
  
  const getTextColor = () => {
    switch(type) {
      case 'success':
        return darkMode ? 'text-green-300' : 'text-green-700';
      case 'error':
        return darkMode ? 'text-red-300' : 'text-red-700';
      case 'warning':
        return darkMode ? 'text-yellow-300' : 'text-yellow-700';
      default:
        return darkMode ? 'text-gray-300' : 'text-gray-700';
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center ${getBgColor()}`}
    >
      <div className={getTextColor()}>
        {type === 'success' && <FiCheck className="mr-2 inline" />}
        {type === 'error' && <FiAlertCircle className="mr-2 inline" />}
        {type === 'warning' && <FiAlertCircle className="mr-2 inline" />}
        <span>{message}</span>
      </div>
      <button 
        onClick={onClose} 
        className={`ml-4 text-gray-500 hover:text-gray-700`}
      >
        <FiX />
      </button>
    </motion.div>
  );
};

const SettingsPage: React.FC = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('appearance');
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'warning';
  }>({ show: false, message: '', type: 'success' });
  const [hasChanges, setHasChanges] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    // Appearance settings
    theme: darkMode ? 'dark' : 'light',
    animationsEnabled: true,
    contrastMode: false,
    fontSize: 'medium',
    
    // Notification settings
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    newFeatureAnnouncements: true,
    weeklyDigest: true,
    
    // Privacy settings
    dataCollection: true,
    shareUsageStats: false,
    cookiePreference: 'essential',
    twoFactorAuth: false,
    
    // Account settings
    language: 'english',
    timezone: 'UTC',
    autoSave: true
  });
  
  // Initial settings reference for checking if changes were made
  const [initialSettings, setInitialSettings] = useState({...settings});
  
  // Check for changes when settings are updated
  useEffect(() => {
    const settingsChanged = JSON.stringify(settings) !== JSON.stringify(initialSettings);
    setHasChanges(settingsChanged);
  }, [settings, initialSettings]);
  
  // Update a specific setting
  const updateSetting = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  // Toggle a boolean setting
  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Handle theme change
  const handleThemeChange = (value: string) => {
    if ((value === 'dark' && !darkMode) || (value === 'light' && darkMode)) {
      toggleDarkMode();
    }
    updateSetting('theme', value);
  };
  
  // Handle reset password
  const handleResetPassword = () => {
    // In a real app, this would trigger a password reset flow
    setNotification({
      show: true,
      message: 'Password reset instructions sent to your email.',
      type: 'success'
    });
  };
  
  // Handle data export
  const handleDataExport = () => {
    // In a real app, this would trigger a data export process
    setNotification({
      show: true,
      message: 'Your data export has been initiated. You will be notified when it\'s ready.',
      type: 'success'
    });
  };
  
  // Handle save changes
  const handleSaveChanges = () => {
    // In a real app, this would save to a backend
    // Simulate API call with timeout
    setNotification({
      show: true,
      message: 'Saving your settings...',
      type: 'warning'
    });
    
    setTimeout(() => {
      setInitialSettings({...settings});
      setHasChanges(false);
      setNotification({
        show: true,
        message: 'Settings saved successfully!',
        type: 'success'
      });
    }, 1000);
  };
  
  // Handle delete account
  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // In a real app, this would trigger account deletion
      setNotification({
        show: true,
        message: 'Account deletion initiated. You will receive a confirmation email.',
        type: 'warning'
      });
    }
  };

  // Tab navigation options
  const tabOptions = [
    { id: 'appearance', label: 'Appearance', icon: darkMode ? <FiSun /> : <FiMoon /> },
    { id: 'notifications', label: 'Notifications', icon: <FiBell /> },
    { id: 'privacy', label: 'Privacy & Security', icon: <FiShield /> },
    { id: 'account', label: 'Account', icon: <FiGlobe /> }
  ];

  return (
    <Layout>
      {notification.show && (
        <NotificationToast 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification({...notification, show: false})} 
        />
      )}
      
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
              Settings
            </h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              Customize your experience with MatrixAI
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Tab Navigation */}
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-1"
            >
              <div className={`rounded-xl ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700/50' 
                  : 'bg-white border border-gray-100'
              } p-4 sticky top-24`}>
                <nav className="space-y-1">
                  {tabOptions.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? (darkMode 
                              ? 'bg-gradient-to-r from-blue-800/50 to-purple-800/50 text-white' 
                              : 'bg-blue-50 text-blue-600')
                          : (darkMode 
                              ? 'text-gray-300 hover:bg-gray-700/50' 
                              : 'text-gray-600 hover:bg-gray-50')
                      }`}
                    >
                      <span className="mr-3">{tab.icon}</span>
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  ))}
                </nav>

                <div className={`mt-6 pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <button
                    onClick={handleSaveChanges}
                    disabled={!hasChanges}
                    className={`w-full py-2.5 rounded-lg ${
                      hasChanges 
                        ? (darkMode
                            ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white'
                            : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white')
                        : (darkMode
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed')
                    } flex items-center justify-center transition-all`}
                  >
                    <FiSave className="mr-2" />
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Settings Content */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className={`rounded-xl ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700/50' 
                  : 'bg-white border border-gray-100'
              } p-6 lg:col-span-3`}
            >
              {/* Appearance Settings */}
              {activeTab === 'appearance' && (
                <div>
                  <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Appearance Settings
                  </h2>

                  <div className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    <SelectOption
                      label="Theme"
                      options={[
                        { value: 'light', label: 'Light' },
                        { value: 'dark', label: 'Dark' },
                        { value: 'system', label: 'Use System Preference' }
                      ]}
                      selectedValue={settings.theme}
                      onChange={(value) => handleThemeChange(value)}
                    />

                    <ToggleSwitch
                      label="Enable Animations"
                      description="Smoother transitions and UI effects"
                      isEnabled={settings.animationsEnabled}
                      toggleFunction={() => toggleSetting('animationsEnabled')}
                    />

                    <ToggleSwitch
                      label="High Contrast Mode"
                      description="Increased contrast for better visibility"
                      isEnabled={settings.contrastMode}
                      toggleFunction={() => toggleSetting('contrastMode')}
                    />

                    <SelectOption
                      label="Font Size"
                      options={[
                        { value: 'small', label: 'Small' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'large', label: 'Large' }
                      ]}
                      selectedValue={settings.fontSize}
                      onChange={(value) => updateSetting('fontSize', value)}
                    />
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Notification Settings
                  </h2>

                  <div className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    <ToggleSwitch
                      label="Email Notifications"
                      description="Receive important updates via email"
                      isEnabled={settings.emailNotifications}
                      toggleFunction={() => toggleSetting('emailNotifications')}
                    />

                    <ToggleSwitch
                      label="Push Notifications"
                      description="Get notifications in your browser"
                      isEnabled={settings.pushNotifications}
                      toggleFunction={() => toggleSetting('pushNotifications')}
                    />

                    <ToggleSwitch
                      label="Marketing Emails"
                      description="Receive newsletters and promotional content"
                      isEnabled={settings.marketingEmails}
                      toggleFunction={() => toggleSetting('marketingEmails')}
                    />

                    <ToggleSwitch
                      label="New Feature Announcements"
                      description="Be the first to know about new features"
                      isEnabled={settings.newFeatureAnnouncements}
                      toggleFunction={() => toggleSetting('newFeatureAnnouncements')}
                    />

                    <ToggleSwitch
                      label="Weekly Activity Digest"
                      description="Get a summary of your weekly activity"
                      isEnabled={settings.weeklyDigest}
                      toggleFunction={() => toggleSetting('weeklyDigest')}
                    />
                  </div>
                </div>
              )}

              {/* Privacy Settings */}
              {activeTab === 'privacy' && (
                <div>
                  <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Privacy & Security
                  </h2>

                  <div className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    <ToggleSwitch
                      label="Two-Factor Authentication"
                      description="Add an extra layer of security to your account"
                      isEnabled={settings.twoFactorAuth}
                      toggleFunction={() => toggleSetting('twoFactorAuth')}
                    />

                    <ToggleSwitch
                      label="Data Collection"
                      description="Allow us to collect anonymous usage data to improve our service"
                      isEnabled={settings.dataCollection}
                      toggleFunction={() => toggleSetting('dataCollection')}
                    />

                    <ToggleSwitch
                      label="Share Usage Statistics"
                      description="Help us improve by sharing how you use the platform"
                      isEnabled={settings.shareUsageStats}
                      toggleFunction={() => toggleSetting('shareUsageStats')}
                    />

                    <SelectOption
                      label="Cookie Preferences"
                      options={[
                        { value: 'essential', label: 'Essential Only' },
                        { value: 'functional', label: 'Functional (Recommended)' },
                        { value: 'all', label: 'All Cookies' }
                      ]}
                      selectedValue={settings.cookiePreference}
                      onChange={(value) => updateSetting('cookiePreference', value)}
                    />

                    <div className="py-4">
                      <button 
                        onClick={handleResetPassword}
                        className={`px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center`}
                      >
                        <FiLock className="mr-2" />
                        Reset Password
                      </button>
                      <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Change your account password for security
                      </p>
                    </div>

                    <div className="py-4">
                      <button 
                        onClick={handleDataExport}
                        className={`px-4 py-2 rounded-lg ${
                          darkMode 
                            ? 'bg-gray-700 text-blue-400 hover:bg-gray-600' 
                            : 'bg-gray-100 text-blue-600 hover:bg-gray-200'
                        } transition-colors`}
                      >
                        Request Data Export
                      </button>
                      <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Download all your data in a portable format
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Settings */}
              {activeTab === 'account' && (
                <div>
                  <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Account Settings
                  </h2>

                  <div className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    <SelectOption
                      label="Language"
                      options={[
                        { value: 'english', label: 'English' },
                        { value: 'spanish', label: 'Spanish' },
                        { value: 'french', label: 'French' },
                        { value: 'german', label: 'German' },
                        { value: 'japanese', label: 'Japanese' },
                        { value: 'chinese', label: 'Chinese' }
                      ]}
                      selectedValue={settings.language}
                      onChange={(value) => updateSetting('language', value)}
                    />

                    <SelectOption
                      label="Timezone"
                      options={[
                        { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
                        { value: 'EST', label: 'EST (Eastern Standard Time)' },
                        { value: 'CST', label: 'CST (Central Standard Time)' },
                        { value: 'MST', label: 'MST (Mountain Standard Time)' },
                        { value: 'PST', label: 'PST (Pacific Standard Time)' },
                        { value: 'IST', label: 'IST (Indian Standard Time)' }
                      ]}
                      selectedValue={settings.timezone}
                      onChange={(value) => updateSetting('timezone', value)}
                    />

                    <ToggleSwitch
                      label="Auto-Save"
                      description="Automatically save your work in progress"
                      isEnabled={settings.autoSave}
                      toggleFunction={() => toggleSetting('autoSave')}
                    />

                    <div className="py-4">
                      <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                        Subscription Plan
                      </h3>
                      <div className={`p-4 rounded-lg ${
                        darkMode 
                          ? 'bg-gray-700 border border-gray-600' 
                          : 'bg-gray-50 border border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              Pro Plan
                            </p>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Renews on November 15, 2023
                            </p>
                          </div>
                          <button 
                            onClick={() => {
                              setNotification({
                                show: true,
                                message: 'Redirecting to subscription management...',
                                type: 'success'
                              });
                            }}
                            className={`px-4 py-2 rounded-lg ${
                              darkMode 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            Manage
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="py-4">
                      <button 
                        onClick={handleDeleteAccount}
                        className={`px-4 py-2 rounded-lg ${
                          darkMode 
                            ? 'bg-gray-700 text-red-400 hover:bg-gray-600' 
                            : 'bg-gray-100 text-red-600 hover:bg-gray-200'
                        } transition-colors`}
                      >
                        Delete Account
                      </button>
                      <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Permanently delete your account and all your data
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage; 