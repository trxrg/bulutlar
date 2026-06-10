import React, { createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import { usePersistentState } from '../hooks/usePersistentState.js';
import { DEFAULT_COLOR_THEME } from '../constants/colorThemes.js';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = usePersistentState('theme', 'light');
  const [colorTheme, setColorThemeState] = usePersistentState('colorTheme', DEFAULT_COLOR_THEME);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-color-theme', colorTheme);
  }, [colorTheme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setSpecificTheme = useCallback((themeName) => {
    setTheme(themeName);
  }, []);

  const setColorTheme = useCallback((colorThemeName) => {
    setColorThemeState(colorThemeName);
  }, []);

  const value = useMemo(() => ({
    theme,
    colorTheme,
    toggleTheme,
    setTheme: setSpecificTheme,
    setColorTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  }), [theme, colorTheme, toggleTheme, setSpecificTheme, setColorTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
