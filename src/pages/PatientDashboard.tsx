import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { PageState } from '../components/ui/PageState.tsx';
import { BotanicalBackground } from '../components/botanical/BotanicalBackground.tsx';
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
  const [copied, setCopied] = useState(false);

  const copyPatientCode = async () => {
    const code = data.patient?.patientCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

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
    <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-8 space-y-8">
      <BotanicalBackground position="bottom-right" />

      {/* Top Welcome Section + Health Journey Widget Card */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-2">
        <div>
          <p className="text-[14px] text-[#484D45] font-medium mb-0.5">Good morning,</p>
          <h1 className="font-['Plus_Jakarta_Sans'] text-[32px] sm:text-[36px] font-bold text-[#0B0808] flex items-center gap-2">
            <span>{data.patient?.name?.split(' ')[0] || 'Ananya'}!</span>
            <span className="text-[28px]">🌿</span>
          </h1>
          <p className="font-['DM_Sans'] text-[15px] text-[#667065] mt-1">
            Your health journey is growing stronger every day.
          </p>
        </div>

        {/* Your Health Journey Widget Card matching reference */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#DFE5D8] p-4 sm:p-5 shadow-xs flex items-center justify-between gap-6 min-w-[290px]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#F2F7EB] flex items-center justify-center text-[#33650E]">
              <span className="material-symbols-outlined text-[24px]">eco</span>
            </div>
            <div>
              <span className="text-[11.5px] font-bold text-[#667065] block uppercase tracking-wider">Your Health Journey</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-['Plus_Jakarta_Sans'] text-[24px] font-bold text-[#0B0808]">12</span>
                <span className="text-[12px] text-[#667065]">Records connected</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('/patient/history')}
            className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#33650E] hover:underline"
          >
            <span>View Timeline</span>
            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards matching reference panel 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Records need review */}
        <div
          onClick={() => onNavigate('/patient/conflicts')}
          className="cursor-pointer bg-[#FFFFFF] p-5 rounded-2xl border border-[#DFE5D8] shadow-xs hover:border-[#CAD4C1] transition-all group"
        >
          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-9 h-9 rounded-full bg-[#FFF0EF] text-[#A33837] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
            </div>
            <div>
              <div className="font-['Plus_Jakarta_Sans'] text-[24px] font-bold text-[#0B0808]">
                {metrics.flaggedDiscrepanciesCount || 3}
              </div>
              <p className="text-[12px] text-[#667065] font-medium -mt-1">Records need review</p>
            </div>
          </div>
          <div className="pt-2 border-t border-[#F0F4EA] flex items-center gap-1 text-[12px] font-bold text-[#33650E] group-hover:underline">
            <span>See discrepancies</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </div>
        </div>

        {/* Card 2: Connected providers */}
        <div
          onClick={() => onNavigate('/patient/history')}
          className="cursor-pointer bg-[#FFFFFF] p-5 rounded-2xl border border-[#DFE5D8] shadow-xs hover:border-[#CAD4C1] transition-all group"
        >
          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-9 h-9 rounded-full bg-[#EDF6E6] text-[#33650E] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">hub</span>
            </div>
            <div>
              <div className="font-['Plus_Jakarta_Sans'] text-[24px] font-bold text-[#0B0808]">
                {metrics.connectedHealthSystems || 4}
              </div>
              <p className="text-[12px] text-[#667065] font-medium -mt-1">Connected providers</p>
            </div>
          </div>
          <div className="pt-2 border-t border-[#F0F4EA] flex items-center gap-1 text-[12px] font-bold text-[#33650E] group-hover:underline">
            <span>Manage sources</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </div>
        </div>

        {/* Card 3: Pending requests */}
        <div
          onClick={() => onNavigate('/patient/consents')}
          className="cursor-pointer bg-[#FFFFFF] p-5 rounded-2xl border border-[#DFE5D8] shadow-xs hover:border-[#CAD4C1] transition-all group"
        >
          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-9 h-9 rounded-full bg-[#FFF5E5] text-[#985C12] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">description</span>
            </div>
            <div>
              <div className="font-['Plus_Jakarta_Sans'] text-[24px] font-bold text-[#0B0808]">
                {metrics.pendingGrantsCount || 2}
              </div>
              <p className="text-[12px] text-[#667065] font-medium -mt-1">Pending requests</p>
            </div>
          </div>
          <div className="pt-2 border-t border-[#F0F4EA] flex items-center gap-1 text-[12px] font-bold text-[#33650E] group-hover:underline">
            <span>Review now</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </div>
        </div>

        {/* Card 4: Expiring soon */}
        <div
          onClick={() => onNavigate('/patient/consents')}
          className="cursor-pointer bg-[#FFFFFF] p-5 rounded-2xl border border-[#DFE5D8] shadow-xs hover:border-[#CAD4C1] transition-all group"
        >
          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-9 h-9 rounded-full bg-[#FFF5E5] text-[#985C12] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">alarm</span>
            </div>
            <div>
              <div className="font-['Plus_Jakarta_Sans'] text-[24px] font-bold text-[#0B0808]">
                0
              </div>
              <p className="text-[12px] text-[#667065] font-medium -mt-1">Expiring soon</p>
            </div>
          </div>
          <div className="pt-2 border-t border-[#F0F4EA] flex items-center gap-1 text-[12px] font-bold text-[#667065]">
            <span>All up to date</span>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Medical Records & Care Timeline Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recent Medical Records */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[#0B0808]">
              Recent Medical Records
            </h2>
            <button
              onClick={() => onNavigate('/patient/history')}
              className="text-[12.5px] font-bold text-[#33650E] hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>

          <div className="space-y-3">
            {/* Record 1 */}
            <div
              onClick={() => onNavigate('/patient/history')}
              className="cursor-pointer bg-[#FFFFFF] p-4.5 rounded-2xl border border-[#DFE5D8] shadow-xs flex items-center justify-between gap-4 hover:border-[#CAD4C1] transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#F2F7EB] text-[#33650E] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">description</span>
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-[14.5px] font-bold text-[#0B0808]">
                    Lab Report
                  </h3>
                  <p className="text-[12px] text-[#667065] mt-0.5">Blood Test Results · May 12, 2024</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EDF6E6] text-[#33650E] border border-[#d2e4c2] mb-1">
                  Verified
                </span>
                <p className="text-[11.5px] text-[#667065]">City Diagnostic Center</p>
              </div>
            </div>

            {/* Record 2 */}
            <div
              onClick={() => onNavigate('/patient/history')}
              className="cursor-pointer bg-[#FFFFFF] p-4.5 rounded-2xl border border-[#DFE5D8] shadow-xs flex items-center justify-between gap-4 hover:border-[#CAD4C1] transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#F2F7EB] text-[#33650E] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">pill</span>
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-[14.5px] font-bold text-[#0B0808]">
                    Prescription
                  </h3>
                  <p className="text-[12px] text-[#667065] mt-0.5">For Atorvastatin 10mg · Apr 28, 2024</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EDF6E6] text-[#33650E] border border-[#d2e4c2] mb-1">
                  Verified
                </span>
                <p className="text-[11.5px] text-[#667065]">Sunrise Hospital</p>
              </div>
            </div>

            {/* Record 3 */}
            <div
              onClick={() => onNavigate('/patient/history')}
              className="cursor-pointer bg-[#FFFFFF] p-4.5 rounded-2xl border border-[#DFE5D8] shadow-xs flex items-center justify-between gap-4 hover:border-[#CAD4C1] transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#F2F7EB] text-[#33650E] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">clinical_notes</span>
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-[14.5px] font-bold text-[#0B0808]">
                    Clinical Note
                  </h3>
                  <p className="text-[12px] text-[#667065] mt-0.5">Follow up consultation · Mar 15, 2024</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF5E5] text-[#985C12] border border-[#fed7aa] mb-1">
                  Pending Review
                </span>
                <p className="text-[11.5px] text-[#667065]">Greenwood Clinic</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Care Timeline Preview with Vine connecting events */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[#0B0808]">
            Care Timeline Preview
          </h2>

          <div className="bg-[#FFFFFF] rounded-2xl border border-[#DFE5D8] p-5 shadow-xs relative">
            <div className="relative pl-7 space-y-5 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-3 before:w-[2.5px] before:bg-gradient-to-b before:from-[#78A541] before:via-[#33650E] before:to-[#579C91]">
              {/* Event 1 */}
              <div className="relative">
                <div className="absolute -left-[23px] top-0.5 w-5 h-5 rounded-full bg-[#FFFFFF] border-2 border-[#78A541] flex items-center justify-center text-[#78A541]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#78A541]" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#667065] uppercase">May 12, 2024</span>
                  <h4 className="font-['Plus_Jakarta_Sans'] text-[13.5px] font-bold text-[#0B0808] mt-0.5">
                    Lab Report
                  </h4>
                  <p className="text-[12px] text-[#484D45]">Cholesterol and lipid panel results added</p>
                </div>
              </div>

              {/* Event 2 */}
              <div className="relative">
                <div className="absolute -left-[23px] top-0.5 w-5 h-5 rounded-full bg-[#FFFFFF] border-2 border-[#33650E] flex items-center justify-center text-[#33650E]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#33650E]" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#667065] uppercase">Apr 28, 2024</span>
                  <h4 className="font-['Plus_Jakarta_Sans'] text-[13.5px] font-bold text-[#0B0808] mt-0.5">
                    Prescription
                  </h4>
                  <p className="text-[12px] text-[#484D45]">Atorvastatin 10mg prescribed</p>
                </div>
              </div>

              {/* Event 3 */}
              <div className="relative">
                <div className="absolute -left-[23px] top-0.5 w-5 h-5 rounded-full bg-[#FFFFFF] border-2 border-[#579C91] flex items-center justify-center text-[#579C91]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#579C91]" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#667065] uppercase">Mar 15, 2024</span>
                  <h4 className="font-['Plus_Jakarta_Sans'] text-[13.5px] font-bold text-[#0B0808] mt-0.5">
                    Clinical Note
                  </h4>
                  <p className="text-[12px] text-[#484D45]">Follow-up for hypertension</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

