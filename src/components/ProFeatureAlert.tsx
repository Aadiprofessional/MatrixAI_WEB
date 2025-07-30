import React, { useContext } from 'react';
import { FiStar, FiLock, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useTranslation } from 'react-i18next';

interface ProFeatureAlertProps {
  featureName: string;
  onClose: () => void;
}

const ProFeatureAlert: React.FC<ProFeatureAlertProps> = ({ featureName, onClose }) => {
  const { darkMode } = useContext(ThemeContext);
  const { userData } = useUser();
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
      <div className={`relative rounded-lg shadow-xl overflow-hidden max-w-md w-full ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-500 z-10"
        >
          <FiX className="w-6 h-6" />
        </button>
        
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-90"></div>
          <div className="absolute inset-0 bg-grid-white/[0.1]"></div>
          
          <div className="relative p-6 flex flex-col items-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-400 bg-opacity-30 mb-4">
              <FiLock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white text-center mb-2">
              {t('common.proFeatureLocked') || 'Pro Feature Locked'}
            </h3>
            <p className="text-white text-opacity-90 text-center">
              {t('common.upgradeToAccess') || 'Upgrade to access'} {featureName} {t('common.unlockCreativePotential') || 'and unlock your full creative potential'}
            </p>
            
            {/* Animated stars */}
            <div className="absolute top-10 left-6 animate-pulse">
              <FiStar className="w-5 h-5 text-yellow-300" />
            </div>
            <div className="absolute bottom-10 right-8 animate-pulse delay-300">
              <FiStar className="w-4 h-4 text-yellow-300" />
            </div>
            <div className="absolute top-20 right-14 animate-pulse delay-700">
              <FiStar className="w-3 h-3 text-yellow-300" />
            </div>
          </div>
        </div>
        
        {/* Body */}
        <div className="p-6">
          <div className="space-y-4">
            <div className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <div className="flex-shrink-0 w-5 h-5 text-green-500 mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p>{t('common.unlimitedAIImageGeneration') || 'Unlimited AI image generation'}</p>
            </div>
            <div className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <div className="flex-shrink-0 w-5 h-5 text-green-500 mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p>{t('common.advancedVideoCreationTools') || 'Advanced video creation tools'}</p>
            </div>
            <div className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <div className="flex-shrink-0 w-5 h-5 text-green-500 mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p>{t('common.professionalContentWritingAssistant') || 'Professional content writing assistant'}</p>
            </div>
          </div>
          
          <div className="mt-6">
            <Link
              to="/subscription"
              className="flex items-center justify-center w-full px-4 py-3 text-base font-medium text-white bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-md hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition duration-300 transform hover:scale-[1.02]"
            >
              {t('common.upgradeToPro') || 'Upgrade to PRO'}
            </Link>
            <button
              onClick={onClose}
              className={`mt-3 flex items-center justify-center w-full px-4 py-3 text-base font-medium border rounded-md ${
                darkMode 
                  ? 'border-gray-700 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t('common.maybeLater') || 'Maybe Later'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProFeatureAlert;