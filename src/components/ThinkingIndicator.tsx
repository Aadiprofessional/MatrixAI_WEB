import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCpu, FiChevronDown } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

interface ThinkingIndicatorProps {
  isThinking: boolean;
  thinkingContent: string;
  darkMode: boolean;
}

const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({
  isThinking,
  thinkingContent,
  darkMode
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isThinking) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex justify-start mb-4"
    >
      <div className="max-w-[90%] sm:max-w-[85%] flex flex-row">
        {/* Avatar */}
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 mr-2 sm:mr-3 ${
          darkMode ? 'bg-gradient-to-r from-blue-900 to-purple-900 text-white' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
        }`}>
          <FiCpu />
        </div>
        
        <div className={`rounded-xl sm:rounded-2xl px-3 sm:px-6 py-3 sm:py-4 ${
          darkMode ? 'bg-gray-800 border border-gray-700 text-gray-100' : 'bg-white border border-gray-200 shadow-sm text-gray-900'
        }`}>
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {t('chat.thinking')}
              </span>
            </div>
            <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            } ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          
          <AnimatePresence>
            {isExpanded && thinkingContent && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 overflow-hidden"
              >
                <div className={`text-sm whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {thinkingContent}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default ThinkingIndicator;