import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getStoredToken, setStoredToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string; fullName?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loginDemo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const me = await api.auth.me();
      setUser(me);
    } catch {
      setStoredToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If no token exists on first load, seed with the demo user token so user immediately has full interactive experience
    const existing = getStoredToken();
    if (!existing) {
      api.auth.login({ email: 'alex@omnispace.dev', password: 'Password123!' })
        .then((res) => {
          setStoredToken(res.accessToken);
          setToken(res.accessToken);
          setUser(res.user);
        })
        .catch(() => {
          // Ignore
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      refreshUser();
    }
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.auth.login(credentials);
    setStoredToken(res.accessToken);
    setToken(res.accessToken);
    setUser(res.user);
  };

  const register = async (data: { email: string; password: string; fullName?: string }) => {
    const res = await api.auth.register(data);
    setStoredToken(res.accessToken);
    setToken(res.accessToken);
    setUser(res.user);
  };

  const logout = () => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
  };

  const loginDemo = async () => {
    await login({ email: 'alex@omnispace.dev', password: 'Password123!' });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        loginDemo,
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
