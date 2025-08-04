import React, { useState, useRef, useEffect } from 'react';
import { FiGlobe, FiChevronDown } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

type Language = 'en' | 'zh-CN' | 'zh-TW';

const SimpleLanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();
  const { darkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<Language>(i18n.language as Language);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update selected language when i18n language changes
  useEffect(() => {
    setSelectedLang(i18n.language as Language);
  }, [i18n.language]);

  const languages = [
    { code: 'en' as Language, name: t('navbar.languages.english', 'English') },
    { code: 'zh-CN' as Language, name: t('navbar.languages.simplifiedChinese', '简体中文') },
    { code: 'zh-TW' as Language, name: t('navbar.languages.traditionalChinese', '繁體中文') }
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

  const handleLanguageChange = (langCode: Language) => {
    setSelectedLang(langCode);
    localStorage.setItem('language', langCode);
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={toggleDropdown}
        className={`flex items-center transition-colors duration-200 text-sm border px-3 py-1.5 rounded-md ${
          darkMode 
            ? 'text-gray-200 hover:text-white bg-gray-800 border-gray-700' 
            : 'text-gray-700 hover:text-gray-900 bg-white border-gray-300 hover:border-gray-400'
        }`}
      >
        <FiGlobe className="w-4 h-4 mr-1.5" />
        <span className="hidden md:inline">{currentLanguage.name}</span>
      
        <FiChevronDown className={`ml-1 w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg backdrop-blur-md border z-50 ${
          darkMode 
            ? 'bg-black/90 border-gray-700' 
            : 'bg-white/95 border-gray-200'
        }`}>
          <div className="py-2">
            <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {t('navbar.selectLanguage', 'Select Language')}
            </div>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center px-3 py-2 text-left text-sm transition-colors duration-150 ${
                  selectedLang === lang.code
                    ? darkMode 
                      ? 'bg-gray-700/50 text-white' 
                      : 'bg-blue-50 text-blue-900'
                    : darkMode 
                      ? 'text-gray-200 hover:bg-gray-700/30 hover:text-white' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span>{lang.name}</span>
                {selectedLang === lang.code && (
                  <span className={`ml-auto ${
                    darkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleLanguageSelector;