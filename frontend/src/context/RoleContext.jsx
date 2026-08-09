import React, { createContext, useContext, useState } from 'react';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const [role, setRoleState] = useState(() => {
    try {
      const savedAuth = localStorage.getItem('ats_auth_session');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (parsed?.user?.role) return parsed.user.role;
      }
    } catch (e) {}
    return localStorage.getItem('user_role') || 'admin';
  });

  const setRole = (newRole) => {
    localStorage.setItem('user_role', newRole);
    setRoleState(newRole);
  };

  const isAdmin = role === 'admin';
  const isHiringManager = role === 'hiring_manager';

  return (
    <RoleContext.Provider value={{ role, setRole, isAdmin, isHiringManager }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
