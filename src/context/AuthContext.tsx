/**
 * Digital Heroes — Authentication & Persona Context
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, getActivePersonaId, setActivePersonaId } from '../api/client';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  activePersonaId: string;
  isVisitor: boolean;
  isAdmin: boolean;
  isSubscriber: boolean;
  hasActiveSubscription: boolean;
  isLoading: boolean;
  toast: { type: 'success' | 'error' | 'info'; message: string } | null;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
  hideToast: () => void;
  refreshUser: () => Promise<void>;
  switchPersona: (personaId: string) => Promise<void>;
  login: (email: string) => Promise<void>;
  signup: (data: any) => Promise<UserProfile>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activePersonaId, setActivePersona] = useState<string>(getActivePersonaId());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(
    null
  );

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 4500);
  };

  const hideToast = () => setToast(null);

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setCurrentUser(res.user);
      setActivePersona(res.activePersonaId);
    } catch (err) {
      console.error('Failed to load current user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const switchPersona = async (personaId: string) => {
    setIsLoading(true);
    try {
      const res = await api.switchPersona(personaId);
      setCurrentUser(res.user);
      setActivePersona(res.activePersonaId);
      showToast('info', `Switched persona to: ${res.user ? res.user.name : 'Public Visitor'}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to switch persona');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email);
      setCurrentUser(res.user);
      setActivePersona(res.user.id);
      showToast('success', `Welcome back, ${res.user.name}`);
    } catch (err: any) {
      showToast('error', err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: any): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await api.signup(data);
      setCurrentUser(res.user);
      setActivePersona(res.user.id);
      showToast('success', `Account created! Welcome to Digital Heroes, ${res.user.name}`);
      return res.user;
    } catch (err: any) {
      showToast('error', err.message || 'Signup failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await switchPersona('visitor');
    showToast('info', 'Signed out. You are now viewing as a Public Visitor.');
  };

  const isVisitor = !currentUser || activePersonaId === 'visitor';
  const isAdmin = currentUser?.role === 'admin';
  const isSubscriber = currentUser?.role === 'subscriber';
  const hasActiveSubscription = currentUser?.subscription.status === 'active';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activePersonaId,
        isVisitor,
        isAdmin,
        isSubscriber,
        hasActiveSubscription,
        isLoading,
        toast,
        showToast,
        hideToast,
        refreshUser,
        switchPersona,
        login,
        signup,
        logout,
      }}
    >
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
