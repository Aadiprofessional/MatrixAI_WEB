import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../locales/en';
import { zhCN } from '../locales/zh-CN';
import { zhTW } from '../locales/zh-TW';

export type Language = 'en' | 'zh-CN' | 'zh-TW';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, any> | string) => string;
}

interface LanguageProviderProps {
  children: React.ReactNode;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation object
const translations = {
  en,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Initialize from localStorage on first render
    const savedLanguage = localStorage.getItem('language') as Language;
    return (savedLanguage && ['en', 'zh-CN', 'zh-TW'].includes(savedLanguage)) ? savedLanguage : 'en';
  });

  // Save language to localStorage when changed
  const handleSetLanguage = (lang: Language) => {
    console.log('Setting language to:', lang);
    setLanguage(lang);
    localStorage.setItem('language', lang);
    // Force a document language attribute update
    document.documentElement.lang = lang.split('-')[0]; // Set html lang attribute
  };

  // Update document language attribute on mount and language change
  useEffect(() => {
    document.documentElement.lang = language.split('-')[0];
  }, [language]);

  // Translation function
  const t = (key: string, params?: Record<string, any> | string): string => {
    if (!key) return '';
    try {
      let translation = translations[language][key as keyof typeof translations[typeof language]] || key;
      
      // If params is a string, it's a fallback value
      if (typeof params === 'string') {
        return translation || params;
      }
      
      // Replace parameters if provided as an object
      if (params && typeof params === 'object') {
        // eslint-disable-next-line no-useless-escape
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          translation = translation.replace(new RegExp(`\{\{${paramKey}\}\}`, 'g'), String(paramValue));
        });
      }
      
      return translation;
    } catch (error) {
      console.warn(`Translation key not found: ${key}`);
      // If params is a string, use it as fallback
      return typeof params === 'string' ? params : key;
    }
  };

  return (
    <LanguageContext.Provider 
      value={{ 
        language, 
        setLanguage: handleSetLanguage, 
        t 
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};