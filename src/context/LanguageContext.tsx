import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../locales/en';
import { zhCN } from '../locales/zh-CN';
import { zhTW } from '../locales/zh-TW';

export type Language = 'en' | 'zh-CN' | 'zh-TW';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
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
  const [language, setLanguage] = useState<Language>('en');

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['en', 'zh-CN', 'zh-TW'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language to localStorage when changed
  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  // Translation function
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
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