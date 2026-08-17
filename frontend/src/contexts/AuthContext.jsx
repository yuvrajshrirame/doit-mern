import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (err) {
          console.error(err);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const signInAnonymously = async () => {
    try {
      const res = await api.post('/auth/anonymous');
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
    } catch (err) {
      throw err.response?.data?.message || 'Anonymous login failed';
    }
  };

  const register = async (email, password, displayName) => {
    try {
      const res = await api.post('/auth/register', { email, password, displayName });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
    } catch (err) {
      throw err.response?.data?.message || 'Registration failed';
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
    } catch (err) {
      throw err.response?.data?.message || 'Login failed';
    }
  };

  const loginWithGoogle = async (credential) => {
    try {
      const res = await api.post('/auth/google', { credential });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
    } catch (err) {
      throw err.response?.data?.message || 'Google Login failed';
    }
  };

  const linkAccount = async (email, password, displayName) => {
    try {
      const res = await api.post('/auth/link', { email, password, displayName });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
    } catch (err) {
      throw err.response?.data?.message || 'Account linking failed';
    }
  };

  const updateProfile = async (displayName) => {
    try {
      const res = await api.put('/auth/profile', { displayName });
      setUser(res.data);
    } catch (err) {
      throw err.response?.data?.message || 'Profile update failed';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInAnonymously,
      register,
      login,
      loginWithGoogle,
      linkAccount,
      updateProfile,
      logout
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
