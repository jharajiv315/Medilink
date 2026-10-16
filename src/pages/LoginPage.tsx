import React, { useState } from 'react';
import { ArrowRight, LockKeyhole, UserRoundPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface LoginPageProps {
  onNavigate: (path: string) => void;
  redirectTo?: string;
}

type AuthMode = 'patient-signin' | 'clinical-signin' | 'signup';

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, redirectTo }) => {
  const { login, registerPatient, logout } = useAuth();
  const [mode, setMode] = useState<AuthMode>(redirectTo?.startsWith('/clinic/') || redirectTo?.startsWith('/admin/') ? 'clinical-signin' : 'patient-signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (mode === 'signup' && password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const user = mode === 'signup'
        ? await registerPatient({ name, email, password, birthDate, gender })
        : await login(email, password);
      if (mode === 'patient-signin' && user.role !== 'patient') {
        await logout();
        throw new Error('This is a clinical team account. Choose Clinical Team Sign In.');
      }
      if (mode === 'clinical-signin' && user.role !== 'clinician' && user.role !== 'admin') {
        await logout();
        throw new Error('This is a patient account. Choose Patient Sign In.');
      }
      const canUseRedirect = redirectTo && (
        (user.role === 'patient' && redirectTo.startsWith('/patient/')) ||
        (user.role === 'clinician' && redirectTo.startsWith('/clinic/')) ||
        user.role === 'admin'
      );
      onNavigate(canUseRedirect
        ? redirectTo
        : user.role === 'clinician'
          ? '/clinic/dashboard'
          : user.role === 'admin'
            ? '/admin/clinicians'
            : '/patient/dashboard');
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Unable to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16 bg-[#f7fbf0]">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-[#DFE5D8] p-6 sm:p-9 shadow-lg">
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2F7EB] text-[#33650E] text-[12px] font-bold border border-[#DFE5D8] mb-3">
            {mode === 'signup' ? <UserRoundPlus className="w-3.5 h-3.5" /> : <LockKeyhole className="w-3.5 h-3.5" />}
            <span>Secure healthcare account</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-[28px] font-bold text-[#0B0808]">
            {mode === 'signup' ? 'Create your patient account' : mode === 'clinical-signin' ? 'Clinical team sign in' : 'Patient sign in'}
          </h1>
          <p className="text-[14px] text-[#596253] mt-2">
            {mode === 'signup'
              ? 'Your account starts with a private, empty medical record.'
              : mode === 'clinical-signin'
                ? 'Doctors sign in with credentials provisioned by a MediLink administrator.'
                : 'Use the email and password associated with your patient account.'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#F3F7EE] border border-[#DCE4D5] mb-6" role="tablist" aria-label="Account access">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'patient-signin'}
            onClick={() => { setMode('patient-signin'); setError(''); }}
            className={`py-2.5 rounded-lg text-[12px] sm:text-[13px] font-semibold transition-colors ${mode === 'patient-signin' ? 'bg-white text-[#214D09] shadow-sm' : 'text-[#596253]'}`}
          >
            Patient Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'clinical-signin'}
            onClick={() => { setMode('clinical-signin'); setError(''); }}
            className={`py-2.5 rounded-lg text-[12px] sm:text-[13px] font-semibold transition-colors ${mode === 'clinical-signin' ? 'bg-white text-[#214D09] shadow-sm' : 'text-[#596253]'}`}
          >
            Clinical Team
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            onClick={() => { setMode('signup'); setError(''); }}
            className={`py-2.5 rounded-lg text-[13px] font-semibold transition-colors ${mode === 'signup' ? 'bg-white text-[#214D09] shadow-sm' : 'text-[#596253]'}`}
          >
            Patient Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <label className="block text-[12px] font-semibold text-[#3F4939]">
                Full name
                <input
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  value={name}
                  onChange={event => setName(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#DCE4D5] px-3.5 py-3 text-[14px] text-[#161B14] outline-none focus:border-[#78A541] focus:ring-2 focus:ring-[#78A541]/20"
                />
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block text-[12px] font-semibold text-[#3F4939]">
                  Date of birth
                  <input
                    type="date"
                    autoComplete="bday"
                    required
                    max={new Date().toISOString().slice(0, 10)}
                    value={birthDate}
                    onChange={event => setBirthDate(event.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#DCE4D5] px-3.5 py-3 text-[14px] text-[#161B14] outline-none focus:border-[#78A541] focus:ring-2 focus:ring-[#78A541]/20"
                  />
                </label>
                <label className="block text-[12px] font-semibold text-[#3F4939]">
                  Gender
                  <select
                    required
                    value={gender}
                    onChange={event => setGender(event.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#DCE4D5] bg-white px-3.5 py-3 text-[14px] text-[#161B14] outline-none focus:border-[#78A541] focus:ring-2 focus:ring-[#78A541]/20"
                  >
                    <option value="" disabled>Select an option</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </label>
              </div>
            </>
          )}

          <label className="block text-[12px] font-semibold text-[#3F4939]">
            Email address
            <input
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#DCE4D5] px-3.5 py-3 text-[14px] text-[#161B14] outline-none focus:border-[#78A541] focus:ring-2 focus:ring-[#78A541]/20"
            />
          </label>

          <label className="block text-[12px] font-semibold text-[#3F4939]">
            Password
            <input
              type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              minLength={12}
              maxLength={256}
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#DCE4D5] px-3.5 py-3 text-[14px] text-[#161B14] outline-none focus:border-[#78A541] focus:ring-2 focus:ring-[#78A541]/20"
            />
            {mode === 'signup' && <span className="block mt-1 text-[11px] font-normal text-[#667065]">Use at least 12 characters.</span>}
          </label>

          {mode === 'signup' && (
            <label className="block text-[12px] font-semibold text-[#3F4939]">
              Confirm password
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={256}
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#DCE4D5] px-3.5 py-3 text-[14px] text-[#161B14] outline-none focus:border-[#78A541] focus:ring-2 focus:ring-[#78A541]/20"
              />
            </label>
          )}

          {error && <div role="alert" className="rounded-xl border border-[#F0C9C6] bg-[#FFF0EF] px-3.5 py-3 text-[13px] text-[#A33837]">{error}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#33650E] hover:bg-[#28510B] disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 text-[14px]"
          >
            <span>{isLoading ? 'Please wait…' : mode === 'signup' ? 'Create Account' : mode === 'clinical-signin' ? 'Clinical Team Sign In' : 'Patient Sign In'}</span>
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-5 rounded-xl bg-[#F7F9F4] border border-[#E5EADF] px-3.5 py-3 text-[11.5px] leading-relaxed text-[#667065]">
          {mode === 'clinical-signin'
            ? 'Doctor and administrator accounts are provisioned by MediLink. If you need access, contact your administrator.'
            : 'Doctors sign in through the Clinical Team tab using administrator-issued credentials.'}
        </div>

        <div className="mt-5 pt-4 border-t border-[#DFE5D8] text-center text-[12px] text-[#667065]">
          <button onClick={() => onNavigate('/')} className="text-[#33650E] hover:underline font-semibold">Back to Home</button>
        </div>
      </div>
    </div>
  );
};
