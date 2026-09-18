import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('sct_token');
    const savedUser = localStorage.getItem('sct_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('sct_token');
        localStorage.removeItem('sct_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await authService.login({ email, password });
    if (response.data && response.data.success) {
      const { token, user } = response.data.data;
      setToken(token);
      setUser(user);
      localStorage.setItem('sct_token', token);
      localStorage.setItem('sct_user', JSON.stringify(user));
      setIsAuthModalOpen(false);
      return user;
    }
    throw new Error('Login failed');
  };

  const register = async (name, email, password) => {
    const response = await authService.register({ name, email, password });
    if (response.data && response.data.success) {
      const { token, user } = response.data.data;
      setToken(token);
      setUser(user);
      localStorage.setItem('sct_token', token);
      localStorage.setItem('sct_user', JSON.stringify(user));
      setIsAuthModalOpen(false);
      return user;
    }
    throw new Error('Registration failed');
  };

  const googleAuth = async (googlePayload) => {
    const response = await authService.googleAuth(googlePayload);
    if (response.data && response.data.success) {
      const { token, user } = response.data.data;
      setToken(token);
      setUser(user);
      localStorage.setItem('sct_token', token);
      localStorage.setItem('sct_user', JSON.stringify(user));
      setIsAuthModalOpen(false);
      return user;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('sct_token');
    localStorage.removeItem('sct_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        googleAuth,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
