// src/context/AuthContext.js
import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { authApi, setLogoutHandler } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sw_user')); }
    catch { return null; }
  });

  const onAuthChangeRef = useRef(null);

  const registerAuthChangeCallback = useCallback((fn) => {
    onAuthChangeRef.current = fn;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sw_token');
    localStorage.removeItem('sw_user');
    setUser(null);
    onAuthChangeRef.current?.('logout');
  }, []);

  // FIX: register logout handler so 401 responses auto-logout globally
  React.useEffect(() => {
    setLogoutHandler(logout);
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    localStorage.setItem('sw_token', data.accessToken);
    localStorage.setItem('sw_user', JSON.stringify(data));
    setUser(data);
    onAuthChangeRef.current?.('login');
    return data;
  }, []);

  const register = useCallback(async (formData) => {
    const data = await authApi.register(formData);
    localStorage.setItem('sw_token', data.accessToken);
    localStorage.setItem('sw_user', JSON.stringify(data));
    setUser(data);
    onAuthChangeRef.current?.('login');
    return data;
  }, []);

  // FIX: isLoggedIn checks BOTH user state AND token in localStorage.
  // Previously if sw_user was missing/corrupted but sw_token existed,
  // isLoggedIn was false and addToCart silently redirected to /login.
  const isLoggedIn = !!user || !!localStorage.getItem('sw_token');

  return (
    <AuthContext.Provider value={{
      user, login, register, logout,
      isLoggedIn,
      registerAuthChangeCallback
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
