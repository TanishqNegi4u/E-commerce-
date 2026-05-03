// src/context/AuthContext.js
import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sw_user')); }
    catch { return null; }
  });

  // BUG-7 FIX: replaced useState-based callback with useRef.
  // The old pattern used setOnAuthChange(fn => { if (fn) fn('login'); return fn; })
  // which relied on React batching behavior that is not guaranteed in Concurrent Mode.
  // useRef is synchronous, stable, and doesn't cause re-renders.
  const onAuthChangeRef = useRef(null);

  const registerAuthChangeCallback = useCallback((fn) => {
    onAuthChangeRef.current = fn;
  }, []);

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

  const logout = useCallback(() => {
    localStorage.removeItem('sw_token');
    localStorage.removeItem('sw_user');
    setUser(null);
    onAuthChangeRef.current?.('logout');
  }, []);

  return (
    <AuthContext.Provider value={{
      user, login, register, logout,
      isLoggedIn: !!user,
      registerAuthChangeCallback
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);