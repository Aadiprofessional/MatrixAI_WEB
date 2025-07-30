import React, { createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';

type LanguageContextType = {
  t: (key: string, options?: any) => string;
  changeLanguage: (lang: string) => void;
  language: string;
};

// Create language context with default values
export const LanguageContext = createContext<LanguageContextType>({
  t: (key: string) => key,
  changeLanguage: () => {},
  language: 'en'
});

// Create a provider component
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <LanguageContext.Provider
      value={{
        t,
        changeLanguage,
        language: i18n.language
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => useContext(LanguageContext);