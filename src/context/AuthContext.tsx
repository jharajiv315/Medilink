import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { UserSession } from '../types/medilink.ts';

interface PatientRegistration {
  name: string;
  email: string;
  password: string;
  birthDate: string;
  gender: string;
}

interface AuthContextType {
  currentUser: UserSession;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserSession>;
  registerPatient: (details: PatientRegistration) => Promise<UserSession>;
  logout: () => Promise<void>;
  getAuthHeaders: () => Record<string, string>;
  isPatient: boolean;
  isClinician: boolean;
  isAdmin: boolean;
}

const placeholderUser: UserSession = {
  id: '',
  name: '',
  email: '',
  role: 'patient'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function readAuthResponse(response: Response): Promise<{ user?: UserSession; error?: string }> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Authentication failed. Please try again.');
  return data;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserSession>(placeholderUser);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    localStorage.removeItem('medilink_session_token');
    localStorage.removeItem('medilink_current_user');
    fetch('/api/auth/me')
      .then(readAuthResponse)
      .then(data => {
        if (!data.user) throw new Error('Session is invalid.');
        setCurrentUser(data.user);
      })
      .catch(() => setCurrentUser(placeholderUser))
      .finally(() => setIsLoading(false));
  }, []);

  const establishSession = (data: { user?: UserSession }) => {
    if (!data.user) throw new Error('The server returned an incomplete session.');
    setCurrentUser(data.user);
    return data.user;
  };

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return establishSession(await readAuthResponse(response));
  };

  const registerPatient = async (details: PatientRegistration) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details)
    });
    return establishSession(await readAuthResponse(response));
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', headers: getAuthHeaders() });
    } catch {
      // Clear the local session view even if the server is temporarily unreachable.
    } finally {
      localStorage.removeItem('medilink_session_token');
      localStorage.removeItem('medilink_current_user');
      setCurrentUser(placeholderUser);
    }
  };

  const getAuthHeaders = useCallback((): Record<string, string> => {
    return { 'Content-Type': 'application/json' };
  }, []);

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: Boolean(currentUser.id),
      isLoading,
      login,
      registerPatient,
      logout,
      getAuthHeaders,
      isPatient: currentUser.role === 'patient',
      isClinician: currentUser.role === 'clinician',
      isAdmin: currentUser.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
