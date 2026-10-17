import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { PageState } from '../components/ui/PageState.tsx';
import type { Patient } from '../types/medilink.ts';

interface PatientDashboardProps {
  onNavigate: (path: string) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ onNavigate }) => {
  const { currentUser, getAuthHeaders } = useAuth();
  const patientId = currentUser.patientId!;

  const [data, setData] = useState<{
    patient?: Patient;
    metrics?: {
      connectedHealthSystems: number;
      consultationsCount: number;
      labsCount: number;
      flaggedDiscrepanciesCount: number;
      activeGrantsCount: number;
      pendingGrantsCount: number;
      totalDocuments: number;
      totalExtractedFacts: number;
    };
    activeGrants?: Array<{ id: string; requesterName: string; requestingOrgName: string; purpose: string; approvedCategories: string[]; expiresAt?: string }>;
    pendingGrants?: Array<{ id: string; requesterName: string; requestingOrgName: string; purpose: string; accessDurationDays: number }>;
    recentEvents?: Array<{ id: string; title: string; description: string; date: string; source: string; category: string; hash?: string }>;
  }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetch(`/api/patients/${patientId}/summary`, {
      headers: getAuthHeaders(), signal: controller.signal
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Unable to load your overview.');
        return data;
      })
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(error => { if (!controller.signal.aborted) { setError(error.message); setLoading(false); } });
    return () => controller.abort();
  }, [patientId, attempt, getAuthHeaders]);

  if (loading || error) return <PageState error={error} onRetry={() => setAttempt(value => value + 1)} title="Loading your health overview" />;

  const metrics = data.metrics || {
    connectedHealthSystems: 0,
    consultationsCount: 0,
    labsCount: 0,
    flaggedDiscrepanciesCount: 0,
    activeGrantsCount: 0,
    pendingGrantsCount: 0,
    totalDocuments: 0,
    totalExtractedFacts: 0
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#DFE5D8] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2F7EB] text-[#33650E] text-[11px] font-bold border border-[#DFE5D8] mb-2">
            <span className="w-2 h-2 rounded-full bg-[#78A541]"></span>
            <span>Patient ID: {data.patient?.patientCode || 'Loading'} · MRN: {data.patient?.mrn || 'Not assigned'}</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-[28px] sm:text-[32px] font-bold text-[#0B0808]">
            Welcome back, {data.patient?.name || currentUser.name}.
          </h1>
          <p className="font-['DM_Sans'] text-[15px] text-[#42493b] mt-1">
            Your healthcare information and sharing permissions, organized in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => onNavigate('/patient/import')}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 bg-[#33650E] hover:bg-[#28510B] text-[#FFFFFF] text-[14px] font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            <span>Import Records</span>
          </button>
          <button
            onClick={() => onNavigate('/patient/consents')}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 bg-[#F2F7EB] hover:bg-[#ebefe4] text-[#33650E] border border-[#DFE5D8] text-[14px] font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
            <span>Share Access</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div
          onClick={() => onNavigate('/patient/history')}
          className="cursor-pointer bg-[#FFFFFF] p-5 sm:p-6 rounded-2xl border border-[#DFE5D8] shadow-sm hover:border-[#78A541] transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-bold text-[#667065] uppercase">Health Systems</span>
            <span className="material-symbols-outlined text-[#33650E] text-[20px] group-hover:scale-110 transition-transform">
              domain
            </span>
          </div>
          <div className="font-['Plus_Jakarta_Sans'] text-[32px] font-bold text-[#0B0808]">
            {metrics.connectedHealthSystems}
          </div>
          <p className="text-[12px] text-[#42493b] mt-1 font-medium">{metrics.connectedHealthSystems} connected sources</p>
        </div>

        <div
          onClick={() => onNavigate('/patient/history')}
          className="cursor-pointer bg-[#FFFFFF] p-5 sm:p-6 rounded-2xl border border-[#DFE5D8] shadow-sm hover:border-[#78A541] transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-bold text-[#667065] uppercase">Consults &amp; Labs</span>
            <span className="material-symbols-outlined text-[#33650E] text-[20px] group-hover:scale-110 transition-transform">
              history_edu
            </span>
          </div>
          <div className="font-['Plus_Jakarta_Sans'] text-[32px] font-bold text-[#0B0808]">
            {metrics.consultationsCount + metrics.labsCount}
          </div>
          <p className="text-[12px] text-[#42493b] mt-1 font-medium">
            {metrics.consultationsCount} consultations · {metrics.labsCount} lab records
          </p>
        </div>

        <div
          onClick={() => onNavigate('/patient/conflicts')}
          className="cursor-pointer bg-[#FFFFFF] p-5 sm:p-6 rounded-2xl border border-[#DFE5D8] shadow-sm hover:border-[#A33837] transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-bold text-[#A33837] uppercase">Action Required</span>
            <span className="material-symbols-outlined text-[#A33837] text-[20px] group-hover:scale-110 transition-transform">
              warning
            </span>
          </div>
          <div className="font-['Plus_Jakarta_Sans'] text-[32px] font-bold text-[#A33837]">
            {metrics.flaggedDiscrepanciesCount}
          </div>
          <p className="text-[12px] text-[#42493b] mt-1 font-medium">{metrics.flaggedDiscrepanciesCount ? 'Review flagged findings' : 'No findings flagged'}</p>
        </div>

        <div
          onClick={() => onNavigate('/patient/consents')}
          className="cursor-pointer bg-[#FFFFFF] p-5 sm:p-6 rounded-2xl border border-[#DFE5D8] shadow-sm hover:border-[#78A541] transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-bold text-[#667065] uppercase">Active Consent</span>
            <span className="material-symbols-outlined text-[#33650E] text-[20px] group-hover:scale-110 transition-transform">
              verified_user
            </span>
          </div>
          <div className="font-['Plus_Jakarta_Sans'] text-[32px] font-bold text-[#0B0808]">
            {metrics.activeGrantsCount} Active
          </div>
          <p className="text-[12px] text-[#42493b] mt-1 font-medium">
            {metrics.pendingGrantsCount} Pending request
          </p>
        </div>
      </div>

      {/* Discrepancy Highlight Banner */}
      {metrics.flaggedDiscrepanciesCount > 0 && (
        <div className="bg-[#FFF5E5] border border-[#985C12]/20 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#FFF0EF] text-[#A33837] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
            <div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[#0B0808]">
                Clinical discrepancies need review
              </h3>
              <p className="font-['DM_Sans'] text-[13px] text-[#42493b] mt-0.5">
                Review the source records and available evidence before taking action.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('/patient/conflicts')}
            className="bg-[#985C12] hover:bg-[#7e4b0e] text-[#FFFFFF] text-[13px] font-semibold px-4 py-2 rounded-xl transition-all shadow-sm shrink-0"
          >
            Review Discrepancy
          </button>
        </div>
      )}

      {/* 2-Column Split: Active Providers & Recent Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Active Consents & Providers */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#DFE5D8] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#DFE5D8]">
              <h2 className="font-['Plus_Jakarta_Sans'] text-[17px] font-bold text-[#0B0808]">
                Authorized Clinicians
              </h2>
              <button
                onClick={() => onNavigate('/patient/consents')}
                className="text-[12px] text-[#33650E] font-bold hover:underline"
              >
                Manage All
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {data.activeGrants?.map(grant => (
                <div key={grant.id} className="p-4 rounded-xl bg-[#F2F7EB] border border-[#DFE5D8] flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-['Plus_Jakarta_Sans'] text-[14px] font-bold text-[#0B0808]">{grant.requesterName}</span>
                    <span className="px-2 py-0.5 rounded-full bg-white text-[#33650E] text-[11px] font-bold border border-[#DFE5D8]">Active</span>
                  </div>
                  <p className="text-[12px] text-[#42493b]">{grant.requestingOrgName} · {grant.purpose}</p>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#DFE5D8] text-[11px]">
                    <span className="text-[#667065]">Scopes: {grant.approvedCategories.join(', ') || 'None'}</span>
                    <button onClick={() => onNavigate('/patient/consents')} className="text-[#A33837] font-semibold hover:underline">Manage</button>
                  </div>
                </div>
              ))}
              {data.pendingGrants?.map(grant => (
                <div key={grant.id} className="p-4 rounded-xl bg-white border border-[#DFE5D8] flex items-center justify-between gap-3">
                  <div>
                    <p className="font-['Plus_Jakarta_Sans'] text-[13px] font-bold text-[#0B0808]">{grant.requesterName}</p>
                    <p className="text-[11px] text-[#667065] mt-0.5">{grant.requestingOrgName} · {grant.purpose}</p>
                  </div>
                  <button onClick={() => onNavigate('/patient/consents')} className="bg-[#33650E] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-[#28510B]">Review</button>
                </div>
              ))}
              {!data.activeGrants?.length && !data.pendingGrants?.length && (
                <div className="py-8 text-center rounded-xl border border-dashed border-[#DCE4D5] text-[13px] text-[#667065]">
                  No clinicians have requested access to your records.
                </div>
              )}
            </div>
          </div>

          {/* Quick Provenance Trust Card */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#DFE5D8] p-6 shadow-sm">
            <h3 className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[#0B0808] mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#33650E] text-[18px]">
                verified
              </span>
              <span>Patient Data Sovereignty</span>
            </h3>
            <p className="font-['DM_Sans'] text-[13px] text-[#42493b] leading-relaxed">
              Uploaded documents receive a SHA-256 fingerprint. Clinicians can view record details only
              through an active patient approved access grant with permitted categories.
            </p>
            <div className="mt-4 pt-3 border-t border-[#DFE5D8] flex items-center justify-between text-[12px]">
              <span className="text-[#667065]">Access History</span>
              <button
                onClick={() => onNavigate('/patient/access-history')}
                className="text-[#33650E] font-bold hover:underline"
              >
                Inspect Ledger →
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Unified History Preview */}
        <div className="lg:col-span-7 bg-[#FFFFFF] rounded-2xl border border-[#DFE5D8] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#DFE5D8]">
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-[17px] font-bold text-[#0B0808]">
                Recent Health Continuity Events
              </h2>
              <p className="text-[12px] text-[#667065]">Chronological longitudinal timeline</p>
            </div>
            <button
              onClick={() => onNavigate('/patient/history')}
              className="text-[13px] text-[#33650E] font-bold hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          <div className="mt-4 divide-y divide-[#F4F5F1]">
            {data.recentEvents?.map(event => (
              <div key={event.id} className="py-3.5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h4 className="font-['Plus_Jakarta_Sans'] text-[14px] font-bold text-[#0B0808]">{event.title}</h4>
                  <p className="text-[12px] text-[#42493b] mt-0.5">{event.description}</p>
                  <p className="text-[11px] text-[#667065] mt-1 font-mono">{event.date} · {event.source}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#F2F7EB] text-[#33650E] text-[11px] font-bold shrink-0">{event.category}</span>
              </div>
            ))}
            {!data.recentEvents?.length && (
              <div className="py-10 text-center">
                <p className="text-[14px] font-semibold text-[#3F4939]">No health records yet</p>
                <p className="mt-1 text-[12px] text-[#667065]">Add a record to begin building your timeline.</p>
                <button onClick={() => onNavigate('/patient/import')} className="mt-4 rounded-xl bg-[#33650E] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#28510B]">Add a record</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
