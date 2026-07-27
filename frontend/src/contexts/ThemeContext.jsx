import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();

  const getThemeKey = () => user?.id ? `sime_theme_${user.id}` : 'sime_theme';
  const getSidebarKey = () => user?.id ? `sime_sidebar_${user.id}` : 'sime_sidebar';

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('sime_theme');
    return saved || 'light';
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sime_sidebar') === 'true';
  });

  useEffect(() => {
    if (user?.id) {
      const userTheme = localStorage.getItem(`sime_theme_${user.id}`);
      if (userTheme) setTheme(userTheme);
      const userSidebar = localStorage.getItem(`sime_sidebar_${user.id}`);
      if (userSidebar !== null) setSidebarCollapsed(userSidebar === 'true');
    }
  }, [user?.id]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(getThemeKey(), theme);
  }, [theme, user?.id]);

  useEffect(() => {
    localStorage.setItem(getSidebarKey(), sidebarCollapsed);
  }, [sidebarCollapsed, user?.id]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, sidebarCollapsed, toggleSidebar }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
