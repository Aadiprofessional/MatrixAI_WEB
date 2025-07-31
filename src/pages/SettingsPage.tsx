import React, { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import { Layout } from '../components';
import { useTranslation } from 'react-i18next';
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
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-4 space-y-2 sm:space-y-0">
      <div className="flex-1 pr-0 sm:pr-4">
        <p className={`font-medium text-sm sm:text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {label}
        </p>
        {description && (
          <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            {description}
          </p>
        )}
      </div>
      <button 
        onClick={toggleFunction}
        className="flex-shrink-0 group self-start sm:self-center"
        aria-checked={isEnabled}
        role="switch"
      >
        <span className={`flex items-center h-6 w-12 sm:h-7 sm:w-14 rounded-full transition-colors ${
          isEnabled 
            ? (darkMode ? 'bg-blue-600' : 'bg-blue-600') 
            : (darkMode ? 'bg-gray-700' : 'bg-gray-300')
        }`}>
          <span className={`flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 transform transition-transform mx-1 rounded-full ${
            isEnabled ? 'translate-x-6 sm:translate-x-7 bg-white' : 'translate-x-0 bg-white'
          }`}>
            {isEnabled ? (
              <FiCheck className="h-2 w-2 sm:h-3 sm:w-3 text-blue-600" />
            ) : (
              <FiX className="h-2 w-2 sm:h-3 sm:w-3 text-gray-400" />
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
    <div className="py-3 sm:py-4">
      <label className={`block font-medium mb-1.5 sm:mb-2 text-sm sm:text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {label}
      </label>
      <select 
        value={selectedValue}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-2 sm:p-2.5 text-sm sm:text-base rounded-lg border ${
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
        return 'bg-green-900/70';
      case 'error':
        return 'bg-red-900/70';
      case 'warning':
        return 'bg-yellow-900/70';
      default:
        return 'bg-gray-800';
    }
  };
  
  const getTextColor = () => {
    switch(type) {
      case 'success':
        return 'text-green-300';
      case 'error':
        return 'text-red-300';
      case 'warning':
        return 'text-yellow-300';
      default:
        return 'text-gray-300';
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed top-2 sm:top-4 right-2 sm:right-4 left-2 sm:left-auto z-50 p-3 sm:p-4 rounded-lg shadow-lg flex items-center ${getBgColor()}`}
    >
      <div className={`${getTextColor()} flex-1`}>
        {type === 'success' && <FiCheck className="mr-1.5 sm:mr-2 inline text-sm sm:text-base" />}
        {type === 'error' && <FiAlertCircle className="mr-1.5 sm:mr-2 inline text-sm sm:text-base" />}
        {type === 'warning' && <FiAlertCircle className="mr-1.5 sm:mr-2 inline text-sm sm:text-base" />}
        <span className="text-sm sm:text-base">{message}</span>
      </div>
      <button 
        onClick={onClose} 
        className={`ml-2 sm:ml-4 text-gray-500 hover:text-gray-700 flex-shrink-0`}
      >
        <FiX className="text-sm sm:text-base" />
      </button>
    </motion.div>
  );
};

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
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
        message: t('settings.passwordResetInstructionsSent'),
        type: 'success'
      });
  };
  
  // Handle data export
  const handleDataExport = () => {
    // In a real app, this would trigger a data export process
    setNotification({
        show: true,
        message: t('settings.dataExportInitiated'),
        type: 'success'
      });
  };
  
  // Handle save changes
  const handleSaveChanges = () => {
    // In a real app, this would save to a backend
    // Simulate API call with timeout
    setNotification({
        show: true,
        message: t('settings.savingSettings'),
        type: 'warning'
      });
    
    setTimeout(() => {
      setInitialSettings({...settings});
      setHasChanges(false);
      setNotification({
          show: true,
          message: t('settings.settingsSavedSuccessfully'),
          type: 'success'
        });
    }, 1000);
  };
  
  // Handle delete account
  const handleDeleteAccount = () => {
    if (window.confirm(t('settings.deleteAccountConfirmation'))) {
      // In a real app, this would trigger account deletion
      setNotification({
        show: true,
        message: t('settings.accountDeletionInitiated'),
        type: 'warning'
      });
    }
  };

  // Tab navigation options
  const tabOptions = [
    { id: 'appearance', label: t('settings.appearance'), icon: darkMode ? <FiSun /> : <FiMoon /> },
    { id: 'notifications', label: t('settings.notifications'), icon: <FiBell /> },
    { id: 'privacy', label: t('settings.privacyAndSecurity'), icon: <FiShield /> },
    { id: 'account', label: t('settings.account'), icon: <FiGlobe /> }
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
      
      <div className="page-background dark py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-8">
        {/* Background gradient effects */}
        <div className="gradient-blob-1"></div>
        <div className="gradient-blob-2"></div>

        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 sm:mb-6 lg:mb-8"
          >
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-1 sm:mb-2">
              {t('settings.settings')}
            </h1>
            <p className="text-sm sm:text-base text-tertiary">
              {t('settings.customizeExperience')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {/* Tab Navigation */}
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-1"
            >
              <div className="rounded-xl glass-effect p-3 sm:p-4 lg:sticky lg:top-24">
                <nav className="space-y-1">
                  {tabOptions.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
                        activeTab === tab.id
                          ? (darkMode 
                              ? 'bg-gradient-to-r from-blue-800/50 to-purple-800/50 text-white' 
                              : 'bg-blue-50 text-blue-600')
                          : (darkMode 
                              ? 'text-gray-300 hover:bg-gray-700/50' 
                              : 'text-gray-600 hover:bg-gray-50')
                      }`}
                    >
                      <span className="mr-2 sm:mr-3 text-sm sm:text-base">{tab.icon}</span>
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  ))}
                </nav>

                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-700">
                  <button
                    onClick={handleSaveChanges}
                    disabled={!hasChanges}
                    className={`w-full py-2 sm:py-2.5 rounded-lg text-sm sm:text-base ${
                      hasChanges 
                        ? 'btn-primary'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    } flex items-center justify-center transition-all`}
                  >
                    <FiSave className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
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
              className="rounded-xl glass-effect p-4 sm:p-5 lg:p-6 lg:col-span-3"
            >
              {/* Appearance Settings */}
              {activeTab === 'appearance' && (
                <div>
                  <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-primary">
                    {t('settings.appearanceSettings')}
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
                      label={t('settings.enableAnimations')}
                      description={t('settings.enableAnimationsDescription')}
                      isEnabled={settings.animationsEnabled}
                      toggleFunction={() => toggleSetting('animationsEnabled')}
                    />

                    <ToggleSwitch
                      label={t('settings.highContrastMode')}
                      description={t('settings.highContrastModeDescription')}
                      isEnabled={settings.contrastMode}
                      toggleFunction={() => toggleSetting('contrastMode')}
                    />

                    <SelectOption
                      label={t('settings.fontSize')}
                      options={[
                        { value: 'small', label: t('settings.fontSizeSmall') },
                        { value: 'medium', label: t('settings.fontSizeMedium') },
                        { value: 'large', label: t('settings.fontSizeLarge') }
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
                  <h2 className="text-xl font-bold mb-6 text-primary">
                    {t('settings.notificationSettings')}
                  </h2>

                  <div className="divide-y divide-gray-700">
                    <ToggleSwitch
                      label={t('settings.emailNotifications')}
                      description={t('settings.emailNotificationsDescription')}
                      isEnabled={settings.emailNotifications}
                      toggleFunction={() => toggleSetting('emailNotifications')}
                    />

                    <ToggleSwitch
                      label={t('settings.pushNotifications')}
                      description={t('settings.pushNotificationsDescription')}
                      isEnabled={settings.pushNotifications}
                      toggleFunction={() => toggleSetting('pushNotifications')}
                    />

                    <ToggleSwitch
                      label={t('settings.marketingEmails')}
                      description={t('settings.marketingEmailsDescription')}
                      isEnabled={settings.marketingEmails}
                      toggleFunction={() => toggleSetting('marketingEmails')}
                    />

                    <ToggleSwitch
                      label={t('settings.newFeatureAnnouncements')}
                      description={t('settings.newFeatureAnnouncementsDescription')}
                      isEnabled={settings.newFeatureAnnouncements}
                      toggleFunction={() => toggleSetting('newFeatureAnnouncements')}
                    />

                    <ToggleSwitch
                      label={t('settings.weeklyActivityDigest')}
                      description={t('settings.weeklyActivityDigestDescription')}
                      isEnabled={settings.weeklyDigest}
                      toggleFunction={() => toggleSetting('weeklyDigest')}
                    />
                  </div>
                </div>
              )}

              {/* Privacy Settings */}
              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-xl font-bold mb-6 text-primary">
                    {t('settings.privacyAndSecurity')}
                  </h2>

                  <div className="divide-y divide-gray-700">
                    <ToggleSwitch
                      label={t('settings.twoFactorAuthentication')}
                      description={t('settings.twoFactorAuthenticationDescription')}
                      isEnabled={settings.twoFactorAuth}
                      toggleFunction={() => toggleSetting('twoFactorAuth')}
                    />

                    <ToggleSwitch
                      label={t('settings.dataCollection')}
                      description={t('settings.dataCollectionDescription')}
                      isEnabled={settings.dataCollection}
                      toggleFunction={() => toggleSetting('dataCollection')}
                    />

                    <ToggleSwitch
                      label={t('settings.shareUsageStatistics')}
                      description={t('settings.shareUsageStatisticsDescription')}
                      isEnabled={settings.shareUsageStats}
                      toggleFunction={() => toggleSetting('shareUsageStats')}
                    />

                    <SelectOption
                      label={t('settings.cookiePreferences')}
                      options={[
                        { value: 'essential', label: t('settings.cookieEssentialOnly') },
                        { value: 'functional', label: t('settings.cookieFunctional') },
                        { value: 'all', label: t('settings.cookieAll') }
                      ]}
                      selectedValue={settings.cookiePreference}
                      onChange={(value) => updateSetting('cookiePreference', value)}
                    />

                    <div className="py-3 sm:py-4">
                      <button 
                        onClick={handleResetPassword}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center w-full sm:w-auto`}
                      >
                        <FiLock className="mr-1.5 sm:mr-2 text-sm sm:text-base" />
                        {t('settings.resetPassword')}
                      </button>
                      <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-tertiary">
                        {t('settings.resetPasswordDescription')}
                      </p>
                    </div>

                    <div className="py-3 sm:py-4">
                      <button 
                        onClick={handleDataExport}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg bg-gray-700 text-blue-400 hover:bg-gray-600 transition-colors w-full sm:w-auto"
                      >
                        {t('settings.requestDataExport')}
                      </button>
                      <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-tertiary">
                        {t('settings.requestDataExportDescription')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Settings */}
              {activeTab === 'account' && (
                <div>
                  <h2 className="text-xl font-bold mb-6 text-primary">
                    {t('settings.accountSettings')}
                  </h2>

                  <div className="divide-y divide-gray-700">
                    <SelectOption
                      label={t('settings.language')}
                      options={[
                        { value: 'english', label: t('settings.languageEnglish') },
                        { value: 'spanish', label: t('settings.languageSpanish') },
                        { value: 'french', label: t('settings.languageFrench') },
                        { value: 'german', label: t('settings.languageGerman') },
                        { value: 'japanese', label: t('settings.languageJapanese') },
                        { value: 'chinese', label: t('settings.languageChinese') }
                      ]}
                      selectedValue={settings.language}
                      onChange={(value) => updateSetting('language', value)}
                    />

                    <SelectOption
                      label={t('settings.timezone')}
                      options={[
                        { value: 'UTC', label: t('settings.timezoneUTC') },
                        { value: 'EST', label: t('settings.timezoneEST') },
                        { value: 'CST', label: t('settings.timezoneCST') },
                        { value: 'MST', label: t('settings.timezoneMST') },
                        { value: 'PST', label: t('settings.timezonePST') },
                        { value: 'IST', label: t('settings.timezoneIST') }
                      ]}
                      selectedValue={settings.timezone}
                      onChange={(value) => updateSetting('timezone', value)}
                    />

                    <ToggleSwitch
                      label={t('settings.autoSave')}
                      description={t('settings.autoSaveDescription')}
                      isEnabled={settings.autoSave}
                      toggleFunction={() => toggleSetting('autoSave')}
                    />

                    <div className="py-3 sm:py-4">
                      <h3 className="font-medium text-primary mb-1.5 sm:mb-2 text-sm sm:text-base">
                        {t('settings.subscriptionPlan')}
                      </h3>
                      <div className="p-3 sm:p-4 rounded-lg glass-effect-light">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                          <div>
                            <p className={`font-medium text-sm sm:text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {t('settings.proPlan')}
                            </p>
                            <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {t('settings.renewsOn', { date: 'November 15, 2023' })}
                            </p>
                          </div>
                          <button 
                            onClick={() => {
                              setNotification({
                                show: true,
                                message: t('settings.redirectingToSubscriptionManagement'),
                                type: 'success'
                              });
                            }}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg btn-primary w-full sm:w-auto"
                          >
                            {t('settings.manage')}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="py-3 sm:py-4">
                      <button 
                        onClick={handleDeleteAccount}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg bg-gray-700 text-red-400 hover:bg-gray-600 transition-colors w-full sm:w-auto"
                      >
                        {t('settings.deleteAccount')}
                      </button>
                      <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-tertiary">
                        {t('settings.deleteAccountDescription')}
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