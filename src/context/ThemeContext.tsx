import React, { useState, useEffect, createContext, useContext, useRef } from 'react';

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
  // Use a ref to track the first render
  const isFirstRender = useRef(true);
  // Use a ref to track if a theme has been applied
  const themeApplied = useRef(false);
  
  // Initialize state from localStorage if available, otherwise use system preference
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('matrixai_theme');
    if (savedTheme !== null) {
      const isDark = savedTheme === 'dark';
      
      // Apply theme class immediately during initialization
      if (typeof document !== 'undefined') {
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        themeApplied.current = true;
      }
      
      return isDark;
    }
    
    // Check system preference
    const prefersDark = 
      typeof window !== 'undefined' && 
      window.matchMedia && 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Apply theme class immediately during initialization
    if (typeof document !== 'undefined') {
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      themeApplied.current = true;
    }
    
    return prefersDark;
  });
  
  const theme = darkMode ? 'dark' : 'light' as const;

  // Update localStorage and apply class when darkMode changes, but skip the first render
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    localStorage.setItem('matrixai_theme', theme);
    
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode, theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't explicitly set a preference
      if (localStorage.getItem('matrixai_theme_manual') !== 'true') {
        setDarkMode(e.matches);
      }
    };
    
    // Use the correct event listener based on browser support
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // For older browsers
      mediaQuery.addListener(handleChange);
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // For older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Memoized toggle function to prevent unnecessary re-renders
  const toggleDarkMode = React.useCallback(() => {
    setDarkMode(prevMode => {
      const newMode = !prevMode;
      // Mark that user has manually changed the theme
      localStorage.setItem('matrixai_theme_manual', 'true');
      return newMode;
    });
  }, []);

  // Memoized color getter to prevent unnecessary re-renders
  const getThemeColors = React.useCallback((): Record<string, string> => {
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
  }, [darkMode]);
  
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo((): ThemeContextType => ({
    darkMode,
    toggleDarkMode,
    theme,
    getThemeColors
  }), [darkMode, toggleDarkMode, theme, getThemeColors]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for using the theme context
export const useTheme = () => useContext(ThemeContext); 