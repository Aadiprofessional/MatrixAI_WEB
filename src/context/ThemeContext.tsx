import React, { useState, useEffect, createContext, useContext } from 'react';

type ThemeContextType = {
  darkMode: boolean;
  toggleDarkMode: () => void;
  theme: 'light' | 'dark';
  getThemeColors: () => Record<string, string>;
};

// Create theme context with default values
export const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  toggleDarkMode: () => {},
  theme: 'light',
  getThemeColors: () => ({
    text: '#000000',
    background: '#FFFFFF',
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    accent: '#F472B6',
  }),
});

// Create a provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const theme = darkMode ? 'dark' : 'light';

  // Check user preference for dark mode
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const getThemeColors = (): Record<string, string> => {
    if (darkMode) {
      return {
        text: '#F3F4F6',
        background: '#111827',
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        accent: '#F472B6',
        border: '#374151',
        card: '#1F2937',
      };
    } else {
      return {
        text: '#111827',
        background: '#FFFFFF',
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        accent: '#F472B6',
        border: '#E5E7EB',
        card: '#FFFFFF',
      };
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, theme, getThemeColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for using the theme context
export const useTheme = () => useContext(ThemeContext); 