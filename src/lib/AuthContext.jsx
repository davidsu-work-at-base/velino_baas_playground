import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const loadUser = async () => {
      try {
        const me = await base44.auth.me();
        if (!cancelled) setUser(me);
      } catch (e) {
        const status = e?.status || e?.response?.status;
        if (!cancelled) {
          if (status === 401) setUser(null);
          else if (status === 403) setAuthError({ type: 'user_not_registered' });
        }
      } finally {
        if (!cancelled) setIsLoadingAuth(false);
      }
    };
    loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = (redirectUrl) => base44.auth.logout(redirectUrl);
  const navigateToLogin = (nextUrl) =>
    base44.auth.redirectToLogin(nextUrl || window.location.href);

  return (
    <AuthContext.Provider value={{ user, isLoadingAuth, authError, logout, navigateToLogin }}>
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