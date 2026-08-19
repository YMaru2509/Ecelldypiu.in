import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(undefined);
const STORAGE_KEY = 'ecell-theme';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'dark';

  try {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }

  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // The active theme still applies when storage is unavailable.
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// The provider and its companion hook intentionally share this context module.
// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
