import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGlobe, FiChevronDown } from 'react-icons/fi';
import { useLanguage, Language } from '../context/LanguageContext';
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { darkMode } = useContext(ThemeContext);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
    { code: 'zh-CN' as Language, name: '简体中文', flag: '🇨🇳' },
    { code: 'zh-TW' as Language, name: '繁體中文', flag: '🇹🇼' }
  ];

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode: Language) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
          darkMode
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
            : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm'
        }`}
      >
        <FiGlobe className="w-4 h-4" />
        <span className="text-sm font-medium">{currentLanguage.flag}</span>
        <span className="text-sm hidden sm:block">{currentLanguage.name}</span>
        <FiChevronDown 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-full right-0 mt-2 w-48 rounded-lg shadow-lg border z-50 ${
              darkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="py-2">
              <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {t('language.select')}
              </div>
              {languages.map((lang) => (
                <motion.button
                  key={lang.code}
                  whileHover={{ backgroundColor: darkMode ? '#374151' : '#f3f4f6' }}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                    language === lang.code
                      ? darkMode
                        ? 'bg-blue-900/50 text-blue-400'
                        : 'bg-blue-50 text-blue-600'
                      : darkMode
                        ? 'text-gray-200 hover:text-white'
                        : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm font-medium">{lang.name}</span>
                  {language === lang.code && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`ml-auto w-2 h-2 rounded-full ${
                        darkMode ? 'bg-blue-400' : 'bg-blue-600'
                      }`}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSelector; 