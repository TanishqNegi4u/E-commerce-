import { createContext, useContext, useState, useCallback } from 'react';
import api from '../config/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken]   = useState(() => localStorage.getItem('shopwave_token'));
  const [user,  setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('shopwave_user')); } catch { return null; }
  });

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('shopwave_token', data.accessToken);
    localStorage.setItem('shopwave_user',  JSON.stringify(data));
    setToken(data.accessToken);
    setUser(data);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('shopwave_token', data.accessToken);
    localStorage.setItem('shopwave_user',  JSON.stringify(data));
    setToken(data.accessToken);
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('shopwave_token');
    localStorage.removeItem('shopwave_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);