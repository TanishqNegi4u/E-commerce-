// src/context/ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('sw_theme');
    if (saved) return saved === 'dark';
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.removeAttribute('data-theme');
      localStorage.setItem('sw_theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('sw_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(v => !v);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);