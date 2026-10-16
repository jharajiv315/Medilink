import React, { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Building2, CircleAlert, LoaderCircle, Stethoscope, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface OrganizationOption {
  id: string;
  name: string;
  location?: string;
}

interface ClinicianAccount {
  id: string;
  name: string;
  email: string;
  organization: string;
  organizationId: string;
  title?: string;
  badgeNumber?: string;
}

const inputClass = 'mt-1.5 w-full rounded-xl border border-[#DCE4D5] bg-white px-3.5 py-3 text-sm text-[#161B14] outline-none focus:border-[#78A541] focus:ring-2 focus:ring-[#78A541]/20';

export const AdminClinicians: React.FC = () => {
  const { getAuthHeaders } = useAuth();
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [clinicians, setClinicians] = useState<ClinicianAccount[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [title, setTitle] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadProvisioningData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [orgResponse, cliniciansResponse] = await Promise.all([
        fetch('/api/admin/organizations', { headers: getAuthHeaders() }),
        fetch('/api/admin/clinicians', { headers: getAuthHeaders() })
      ]);
      const [orgData, cliniciansData] = await Promise.all([orgResponse.json(), cliniciansResponse.json()]);
      if (!orgResponse.ok) throw new Error(orgData.error || 'Could not load organizations.');
      if (!cliniciansResponse.ok) throw new Error(cliniciansData.error || 'Could not load clinician accounts.');
      setOrganizations(orgData.organizations ?? []);
      setClinicians(cliniciansData.clinicians ?? []);
      setOrganizationId(current => current || orgData.organizations?.[0]?.id || '');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load clinician provisioning.');
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => { void loadProvisioningData(); }, [loadProvisioningData]);

  const createAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/clinicians', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, email, organizationId, title, badgeNumber, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not provision this doctor account.');
      setClinicians(current => [data.clinician, ...current]);
      setName('');
      setEmail('');
      setTitle('');
      setBadgeNumber('');
      setPassword('');
      setNotice(`Account created for ${data.clinician.name}. Share the initial password through an approved secure channel.`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to provision this account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-5rem)] bg-[#F7F9F4] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#DCE4D5] bg-white px-3 py-1 text-xs font-semibold text-[#33650E]">
              <Stethoscope className="h-3.5 w-3.5" /> Clinical team access
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#162012] sm:text-3xl">Doctor accounts</h1>
            <p className="mt-1 max-w-2xl text-sm text-[#667065]">Provision named clinician accounts. Doctors sign in with their own email and password; public sign-up remains patient-only.</p>
          </div>
          <div className="rounded-xl border border-[#DCE4D5] bg-white px-4 py-3 text-xs text-[#667065]">
            <span className="font-semibold text-[#33650E]">Access control</span><br />Only signed-in administrators can provision accounts.
          </div>
        </div>

        {error && <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-[#F0C9C6] bg-[#FFF0EF] px-4 py-3 text-sm text-[#A33837]"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
        {notice && <div role="status" className="mb-5 flex items-start gap-2 rounded-xl border border-[#CFE3BF] bg-[#F1F8EB] px-4 py-3 text-sm text-[#33650E]"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />{notice}</div>}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <form onSubmit={createAccount} className="rounded-2xl border border-[#DFE5D8] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF5E6] text-[#33650E]"><UserPlus className="h-5 w-5" /></div>
              <div><h2 className="font-semibold text-[#172014]">Provision a doctor</h2><p className="text-xs text-[#667065]">Their account is ready to use immediately.</p></div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-semibold text-[#3F4939]">Doctor’s full name
                <input className={inputClass} required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={event => setName(event.target.value)} />
              </label>
              <label className="block text-xs font-semibold text-[#3F4939]">Work email
                <input className={inputClass} type="email" required maxLength={254} autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} />
              </label>
              <label className="block text-xs font-semibold text-[#3F4939]">Organization
                <select className={inputClass} required value={organizationId} onChange={event => setOrganizationId(event.target.value)}>
                  {organizations.map(organization => <option key={organization.id} value={organization.id}>{organization.name}{organization.location ? ` · ${organization.location}` : ''}</option>)}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-[#3F4939]">Clinical title
                  <input className={inputClass} maxLength={100} placeholder="e.g. Attending Physician" value={title} onChange={event => setTitle(event.target.value)} />
                </label>
                <label className="block text-xs font-semibold text-[#3F4939]">Provider ID <span className="font-normal text-[#81897D]">(optional)</span>
                  <input className={inputClass} maxLength={64} value={badgeNumber} onChange={event => setBadgeNumber(event.target.value)} />
                </label>
              </div>
              <label className="block text-xs font-semibold text-[#3F4939]">Initial password
                <input className={inputClass} type="password" required minLength={12} maxLength={256} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} />
                <span className="mt-1 block font-normal text-[#788171]">At least 12 characters. Share it outside MediLink through a secure channel.</span>
              </label>
            </div>

            <button type="submit" disabled={isSubmitting || isLoading || !organizations.length} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#33650E] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#28510B] disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {isSubmitting ? 'Creating account…' : 'Create doctor account'}
            </button>
          </form>

          <section className="rounded-2xl border border-[#DFE5D8] bg-white p-5 shadow-sm sm:p-6" aria-labelledby="clinician-list-heading">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div><h2 id="clinician-list-heading" className="font-semibold text-[#172014]">Provisioned doctors</h2><p className="mt-1 text-xs text-[#667065]">Passwords are never shown here.</p></div>
              <span className="rounded-full bg-[#F2F7EB] px-3 py-1 text-xs font-semibold text-[#33650E]">{clinicians.length} accounts</span>
            </div>
            {isLoading ? <div className="flex items-center gap-2 py-8 text-sm text-[#667065]"><LoaderCircle className="h-4 w-4 animate-spin" />Loading accounts…</div> : clinicians.length ? (
              <ul className="divide-y divide-[#EDF0E9]">
                {clinicians.map(clinician => <li key={clinician.id} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F2F7EB] text-[#33650E]"><Stethoscope className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#172014]">{clinician.name}</p>
                    <p className="truncate text-xs text-[#667065]">{clinician.email}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-[#667065]"><Building2 className="h-3 w-3" />{clinician.organization}{clinician.title ? ` · ${clinician.title}` : ''}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-[#DCE4D5] px-2 py-1 text-[10px] font-semibold text-[#53614C]">Doctor</span>
                </li>)}
              </ul>
            ) : <div className="rounded-xl border border-dashed border-[#DCE4D5] bg-[#FAFBF8] px-4 py-8 text-center text-sm text-[#667065]">No clinician accounts found.</div>}
          </section>
        </div>
      </div>
    </section>
  );
};
