import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../lib/api';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  role?: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, firstName?: string, lastName?: string, phone?: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken) {
      setToken(storedToken);
      // Set user immediately from localStorage if available, then refresh
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Failed to parse stored user:', e);
        }
      }
      loadUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await authApi.getProfile();
      setUser(profile);
      localStorage.setItem('auth_user', JSON.stringify(profile)); // Store user data
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // Token might be invalid, clear it
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('auth_user', JSON.stringify(response.user)); // Store user data
    setToken(response.token);
    setUser(response.user);
    // Reload profile to ensure we have the latest data (including role)
    await loadUserProfile();
    // Return the user data for immediate use
    return response.user;
  };

  const register = async (email: string, password: string, firstName?: string, lastName?: string, phone?: string) => {
    const response = await authApi.register(email, password, firstName, lastName, phone);
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('auth_user', JSON.stringify(response.user)); // Store user data
    setToken(response.token);
    setUser(response.user);
    // Reload profile to ensure we have the latest role
    await loadUserProfile();
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, isAdmin, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

