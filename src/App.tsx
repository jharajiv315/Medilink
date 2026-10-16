import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { PatientDashboard } from './pages/PatientDashboard.tsx';
import { PatientImport } from './pages/PatientImport.tsx';
import { PatientHistory } from './pages/PatientHistory.tsx';
import { PatientConflicts } from './pages/PatientConflicts.tsx';
import { PatientConsents } from './pages/PatientConsents.tsx';
import { PatientAccessHistory } from './pages/PatientAccessHistory.tsx';
import { ClinicDashboard } from './pages/ClinicDashboard.tsx';
import { ClinicAccessRequest } from './pages/ClinicAccessRequest.tsx';
import { ClinicHandoff } from './pages/ClinicHandoff.tsx';
import { Unauthorized } from './pages/Unauthorized.tsx';

function AppContent() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const { currentUser } = useAuth();

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (path === currentPath) return;

    if (path.startsWith('/#')) {
      const id = path.replace('/#', '');
      if (currentPath === '/' || currentPath === '') {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      } else {
        window.history.pushState({}, '', '/');
        setCurrentPath('/');
        setTimeout(() => {
          const el = document.getElementById(id);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
        return;
      }
    }

    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0 });
  };

  // Route matching
  const renderScreen = () => {
    if (currentPath === '/' || currentPath === '') {
      return <LandingPage onNavigate={navigate} />;
    }
    if (currentPath === '/login') {
      return <LoginPage onNavigate={navigate} />;
    }
    if (currentPath === '/patient/dashboard') {
      return <PatientDashboard onNavigate={navigate} />;
    }
    if (currentPath === '/patient/import') {
      return <PatientImport onNavigate={navigate} />;
    }
    if (currentPath === '/patient/history') {
      return <PatientHistory onNavigate={navigate} />;
    }
    if (currentPath === '/patient/conflicts') {
      return <PatientConflicts onNavigate={navigate} />;
    }
    if (currentPath === '/patient/consents') {
      return <PatientConsents onNavigate={navigate} />;
    }
    if (currentPath === '/patient/access-history') {
      return <PatientAccessHistory onNavigate={navigate} />;
    }
    if (currentPath === '/clinic/dashboard') {
      return <ClinicDashboard onNavigate={navigate} />;
    }
    if (currentPath === '/clinic/access-requests') {
      return <ClinicAccessRequest onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/clinic/handoff/')) {
      const grantId = currentPath.replace('/clinic/handoff/', '') || 'grant-sutter-01';
      return <ClinicHandoff grantId={grantId} onNavigate={navigate} />;
    }
    if (currentPath === '/unauthorized') {
      return <Unauthorized onNavigate={navigate} />;
    }

    // Default to LandingPage
    return <LandingPage onNavigate={navigate} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7fbf0] text-[#181d16] font-['DM_Sans']">
      <Navbar currentPath={currentPath} onNavigate={navigate} />
      <main className="flex-1 pt-20">
        {renderScreen()}
      </main>
      <Footer onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
