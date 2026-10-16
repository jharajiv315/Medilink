import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserSession } from '../types/medilink.ts';

interface AuthContextType {
  currentUser: UserSession;
  allUsers: UserSession[];
  token: string | null;
  setCurrentUser: (user: UserSession) => void;
  switchUser: (userId: string) => Promise<void>;
  getAuthHeaders: () => Record<string, string>;
  isPatient: boolean;
  isClinician: boolean;
  isAdmin: boolean;
}

const defaultUser: UserSession = {
  id: 'user-ananya',
  name: 'Ananya Sharma',
  email: 'ananya.sharma@example.com',
  role: 'patient',
  patientId: 'DEMO-P001'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserSession>(() => {
    try {
      const saved = localStorage.getItem('medilink_current_user');
      return saved ? JSON.parse(saved) : defaultUser;
    } catch {
      return defaultUser;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('medilink_session_token') || null;
  });

  const [allUsers, setAllUsers] = useState<UserSession[]>([
    defaultUser,
    {
      id: 'user-dr-vance',
      name: 'Dr. Marcus Vance',
      email: 'm.vance@sutterhealth.org',
      role: 'clinician',
      organization: 'Sutter Health Clinical Network',
      organizationId: 'org-sutter',
      title: 'Attending Physician & Clinical Lead',
      badgeNumber: 'MD-84920'
    },
    {
      id: 'user-auditor',
      name: 'Sarah Chen, CISA',
      email: 'compliance@medilink.health',
      role: 'admin',
      organization: 'MediLink Clinical Governance',
      title: 'Chief Compliance & Privacy Officer'
    }
  ]);

  // Authenticate initial user session on mount
  useEffect(() => {
    fetch('/api/auth/users')
      .then(res => res.json())
      .then(data => {
        if (data.users && Array.isArray(data.users)) {
          setAllUsers(data.users);
        }
      })
      .catch(() => {});

    // Ensure session token exists for current user
    if (!token && currentUser) {
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      })
        .then(res => res.json())
        .then(data => {
          if (data.token) {
            setToken(data.token);
            localStorage.setItem('medilink_session_token', data.token);
          }
        })
        .catch(() => {});
    }
  }, []);

  const switchUser = async (userId: string) => {
    const found = allUsers.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('medilink_current_user', JSON.stringify(found));

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });
        const data = await res.json();
        if (data.token) {
          setToken(data.token);
          localStorage.setItem('medilink_session_token', data.token);
        }
      } catch (err) {
        console.warn('Could not exchange token during switch:', err);
      }
    }
  };

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-medilink-demo-user': currentUser.id
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        token,
        setCurrentUser,
        switchUser,
        getAuthHeaders,
        isPatient: currentUser.role === 'patient',
        isClinician: currentUser.role === 'clinician',
        isAdmin: currentUser.role === 'admin'
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
