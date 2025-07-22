import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGlobe, FiChevronDown, FiCheck } from 'react-icons/fi';
import { useLanguage, Language } from '../context/LanguageContext';
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { darkMode } = useContext(ThemeContext);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<Language>(language);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update selected language when context language changes
  useEffect(() => {
    setSelectedLang(language);
  }, [language]);

  const languages = [
    { code: 'en' as Language, name: 'English' },
    { code: 'zh-CN' as Language, name: '简体中文' },
    { code: 'zh-TW' as Language, name: '繁體中文' }
  ];

  const currentLanguage = languages.find(lang => lang.code === selectedLang) || languages[0];

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

  // Handle ESC key to close dropdown
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isOpen]);

  const handleLanguageChange = (langCode: Language) => {
    console.log('Language changed to:', langCode);
    setSelectedLang(langCode);
    setLanguage(langCode);
    setIsOpen(false);
    
    // Force reload the page to ensure all components update
    // This is a fallback in case context updates aren't propagating
    window.location.reload();
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
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <FiGlobe className="w-4 h-4" />
      
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
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="language-menu"
          >
            <div className="py-2">
              <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {t('language.select') || 'Select Language'}
              </div>
              {languages.map((lang) => (
                <motion.button
                  key={lang.code}
                  whileHover={{ backgroundColor: darkMode ? '#374151' : '#f3f4f6' }}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                    selectedLang === lang.code
                      ? darkMode
                        ? 'bg-blue-900/50 text-blue-400'
                        : 'bg-blue-50 text-blue-600'
                      : darkMode
                        ? 'text-gray-200 hover:text-white'
                        : 'text-gray-700 hover:text-gray-900'
                  }`}
                  role="menuitem"
                >
         
                  <span className="text-sm font-medium">{lang.name}</span>
                  {selectedLang === lang.code && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto"
                    >
                      <FiCheck className={`w-4 h-4 ${
                        darkMode ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                    </motion.div>
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