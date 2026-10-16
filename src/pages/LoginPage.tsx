import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { allUsers, switchUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState('user-ananya');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (userId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (data.user) {
        switchUser(data.user.id);
        if (data.user.role === 'patient') {
          onNavigate('/patient/dashboard');
        } else if (data.user.role === 'clinician') {
          onNavigate('/clinic/dashboard');
        } else {
          onNavigate('/patient/access-history');
        }
      }
    } catch {
      switchUser(userId);
      onNavigate(userId === 'user-dr-vance' ? '/clinic/dashboard' : '/patient/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-16 bg-[#f7fbf0]">
      <div className="w-full max-w-xl bg-[#FFFFFF] rounded-3xl border border-[#DFE5D8] p-8 sm:p-10 shadow-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2F7EB] text-[#33650E] text-[12px] font-bold border border-[#DFE5D8] mb-3">
            <span className="w-2 h-2 rounded-full bg-[#78A541]"></span>
            <span>Healthcare Identity Gateway</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-[28px] font-bold text-[#0B0808]">
            Sign in to MediLink
          </h1>
          <p className="font-['DM_Sans'] text-[14px] text-[#42493b] mt-1">
            Choose a verified demo persona to test patient consent, medical timeline, or clinician
            handoff workflows.
          </p>
        </div>

        {/* Demo Personas List */}
        <div className="space-y-3 mb-6">
          {allUsers.map(user => {
            const isSelected = selectedUserId === user.id;
            return (
              <div
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-[#33650E] bg-[#F2F7EB] shadow-sm'
                    : 'border-[#DFE5D8] hover:bg-[#F4F5F1]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-[14px] ${
                      user.role === 'patient'
                        ? 'bg-[#33650E] text-[#FFFFFF]'
                        : user.role === 'clinician'
                        ? 'bg-[#214c00] text-[#FFFFFF]'
                        : 'bg-[#484D45] text-[#FFFFFF]'
                    }`}
                  >
                    {user.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-[15px] text-[#0B0808]">
                        {user.name}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          user.role === 'patient'
                            ? 'bg-[#e5eadf] text-[#33650E]'
                            : user.role === 'clinician'
                            ? 'bg-[#bdef81] text-[#214c00]'
                            : 'bg-[#e0e4d9] text-[#181d16]'
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>
                    <p className="font-['DM_Sans'] text-[12px] text-[#42493b] mt-0.5">
                      {user.role === 'patient'
                        ? 'Patient with 3 connected providers & 1 penicillin allergy discrepancy'
                        : user.role === 'clinician'
                        ? 'Attending Physician at Sutter Health requesting patient records'
                        : 'Compliance Officer monitoring immutable audit trail and access grants'}
                    </p>
                  </div>
                </div>

                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 border-[#33650E]">
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#33650E]"></div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        <button
          onClick={() => handleLogin(selectedUserId)}
          disabled={isLoading}
          className="w-full bg-[#33650E] hover:bg-[#28510B] text-[#FFFFFF] font-['DM_Sans'] font-semibold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-[15px] active:scale-[0.99]"
        >
          {isLoading ? (
            <span>Authenticating...</span>
          ) : (
            <>
              <span>
                Enter as{' '}
                {selectedUserId === 'user-ananya'
                  ? 'Patient (Ananya)'
                  : selectedUserId === 'user-dr-vance'
                  ? 'Clinician (Dr. Vance)'
                  : 'Compliance Officer'}
              </span>
              <span className="material-symbols-outlined text-[18px]">login</span>
            </>
          )}
        </button>

        <div className="mt-6 pt-5 border-t border-[#DFE5D8] flex items-center justify-between text-[11px] text-[#667065]">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-[#33650E]">lock</span>
            Zero-knowledge session simulation
          </span>
          <button
            onClick={() => onNavigate('/')}
            className="text-[#33650E] hover:underline font-semibold"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};
