import React, { createContext, useContext, useState } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem('ats_auth_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const isAuthenticated = !!(session && session.isAuthenticated);
  const currentUser = session ? session.user : null;

  const login = async (roleKey, inputUsername, inputPassword, setRoleFn) => {
    const cleanInputUser = (inputUsername || '').trim().toLowerCase();

    try {
      const res = await authApi.login(cleanInputUser, inputPassword, roleKey);
      
      if (res.data && res.data.status === 'success') {
        const authUser = res.data.user;
        const newSession = {
          isAuthenticated: true,
          user: {
            id: authUser.id,
            username: authUser.username,
            role: authUser.role,
            loginTime: new Date().toISOString()
          }
        };

        localStorage.setItem('ats_auth_session', JSON.stringify(newSession));
        setSession(newSession);

        if (typeof setRoleFn === 'function') {
          setRoleFn(authUser.role);
        }

        return { success: true };
      }

      return { 
        success: false, 
        message: res.data?.message || 'Authentication failed. Incorrect username or password.' 
      };
    } catch (err) {
      const errorDetail = err.response?.data?.detail || 'Authentication failed. Please verify credentials.';
      return { success: false, message: errorDetail };
    }
  };

  const logout = () => {
    localStorage.removeItem('ats_auth_session');
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
