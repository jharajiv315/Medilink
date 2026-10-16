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
import { AdminClinicians } from './pages/AdminClinicians.tsx';
import { ClinicDashboard } from './pages/ClinicDashboard.tsx';
import { ClinicAccessRequest } from './pages/ClinicAccessRequest.tsx';
import { ClinicHandoff } from './pages/ClinicHandoff.tsx';
import { Unauthorized } from './pages/Unauthorized.tsx';

function AppContent() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const { currentUser, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (currentPath !== '/' || !window.location.hash) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [currentPath]);

  const navigate = (path: string) => {
    if (path.startsWith('/#')) {
      window.history.pushState({}, '', path);
      if (currentPath === '/') {
        document.getElementById(decodeURIComponent(path.slice(2)))?.scrollIntoView({ behavior: 'smooth' });
      } else {
        setCurrentPath('/');
      }
      return;
    }

    if (path === currentPath && !window.location.hash) return;

    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0 });
  };

  // Route matching
  const renderScreen = () => {
    const patientRoute = currentPath.startsWith('/patient/');
    const clinicRoute = currentPath.startsWith('/clinic/');
    const adminRoute = currentPath.startsWith('/admin/');

    if (isLoading) {
      return <div className="min-h-[60vh] flex items-center justify-center text-sm text-[#667065]">Checking your session…</div>;
    }

    if (!isAuthenticated && currentPath !== '/' && currentPath !== '/login' && currentPath !== '/unauthorized') {
      return <LoginPage onNavigate={navigate} redirectTo={currentPath} />;
    }

    if (isAuthenticated && patientRoute && currentUser.role !== 'patient' && currentUser.role !== 'admin') {
      return <Unauthorized onNavigate={navigate} />;
    }

    if (isAuthenticated && clinicRoute && currentUser.role !== 'clinician' && currentUser.role !== 'admin') {
      return <Unauthorized onNavigate={navigate} />;
    }

    if (isAuthenticated && adminRoute && currentUser.role !== 'admin') {
      return <Unauthorized onNavigate={navigate} />;
    }

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
    if (currentPath === '/admin/clinicians') {
      return <AdminClinicians />;
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

    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <p className="text-sm font-semibold text-[#33650E]">404 · Page not found</p>
        <h1 className="mt-3 text-3xl font-bold">This page isn’t available</h1>
        <p className="mt-3 text-[#667065]">Check the address or return to MediLink.</p>
        <button onClick={() => navigate('/')} className="mt-6 rounded-xl bg-[#33650E] px-6 py-3 font-semibold text-white">Back to home</button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7fbf0] text-[#181d16] font-['DM_Sans']">
      <a href="#main-content" className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-xl bg-white px-4 py-3 font-semibold text-[#33650E] shadow-lg focus:translate-y-0">Skip to content</a>
      <Navbar currentPath={currentPath} onNavigate={navigate} />
      <main id="main-content" tabIndex={-1} className="flex-1 pt-20">
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
