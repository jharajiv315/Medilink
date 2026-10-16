import React, { useState, useEffect } from 'react';
import type { Patient } from '../types/medilink.ts';

interface PatientDashboardProps {
  onNavigate: (path: string) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ onNavigate }) => {
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
  }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/patients/DEMO-P001/summary')
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const metrics = data.metrics || {
    connectedHealthSystems: 3,
    consultationsCount: 14,
    labsCount: 28,
    flaggedDiscrepanciesCount: 1,
    activeGrantsCount: 1,
    pendingGrantsCount: 1,
    totalDocuments: 4,
    totalExtractedFacts: 6
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#DFE5D8] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2F7EB] text-[#33650E] text-[11px] font-bold border border-[#DFE5D8] mb-2">
            <span className="w-2 h-2 rounded-full bg-[#78A541]"></span>
            <span>Patient ID: DEMO-P001 • MRN-92048-A</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-[28px] sm:text-[32px] font-bold text-[#0B0808]">
            Welcome back, {data.patient?.name || 'Ananya'}.
          </h1>
          <p className="font-['DM_Sans'] text-[15px] text-[#42493b] mt-1">
            Your healthcare journey, organized in one place. Connected across 3 clinical networks.
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
          <p className="text-[12px] text-[#42493b] mt-1 font-medium">Memorial • Mayo • Sutter</p>
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
            14 Consultations • 28 Lab panels
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
          <p className="text-[12px] text-[#42493b] mt-1 font-medium">Penicillin Allergy Conflict</p>
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
                Clinical Discrepancy Detected: Penicillin Sensitivity
              </h3>
              <p className="font-['DM_Sans'] text-[13px] text-[#42493b] mt-0.5">
                Memorial Hospital lists severe penicillin hives, while Allergy &amp; Asthma Center
                documents a negative challenge. Review both source documents.
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
              <div className="p-4 rounded-xl bg-[#F2F7EB] border border-[#DFE5D8] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#33650E] text-[18px]">
                      medical_services
                    </span>
                    <span className="font-['Plus_Jakarta_Sans'] text-[14px] font-bold text-[#0B0808]">
                      Dr. Marcus Vance
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#FFFFFF] text-[#33650E] text-[11px] font-bold border border-[#DFE5D8]">
                    Active • 24d left
                  </span>
                </div>
                <p className="text-[12px] text-[#42493b]">
                  Sutter Health Clinical Network • Specialty Consultation &amp; Handoff
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-[#DFE5D8] text-[11px]">
                  <span className="text-[#667065]">
                    Scopes: Allergies, Meds, Labs, Consults
                  </span>
                  <button
                    onClick={() => onNavigate('/patient/consents')}
                    className="text-[#A33837] font-semibold hover:underline"
                  >
                    Revoke
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#DFE5D8] flex items-center justify-between">
                <div>
                  <p className="font-['Plus_Jakarta_Sans'] text-[13px] font-bold text-[#0B0808]">
                    Dr. Elena Rostova (Memorial Hospital)
                  </p>
                  <p className="text-[11px] text-[#667065] mt-0.5">
                    Requested 14-day access for Diabetic Review
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('/patient/consents')}
                  className="bg-[#33650E] text-[#FFFFFF] text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-[#28510B]"
                >
                  Review
                </button>
              </div>
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
              Every document is SHA-256 hashed and stored with zero-knowledge keys. Only providers you
              explicitly authorize receive granular category access.
            </p>
            <div className="mt-4 pt-3 border-t border-[#DFE5D8] flex items-center justify-between text-[12px]">
              <span className="text-[#667065]">Immutable Audit Ledger</span>
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
            <div className="py-3.5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F2F7EB] text-[#33650E] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">science</span>
                </div>
                <div>
                  <h4 className="font-['Plus_Jakarta_Sans'] text-[14px] font-bold text-[#0B0808]">
                    Quest Diagnostics — CMP &amp; Glycated Hemoglobin (HbA1c)
                  </h4>
                  <p className="text-[12px] text-[#42493b] mt-0.5">
                    Fasting Glucose: 118 mg/dL • HbA1c: 6.8% • eGFR: 92 mL/min
                  </p>
                  <p className="text-[11px] text-[#667065] mt-1 font-mono">
                    24 Sep 2026 • SHA-256 verified
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#F2F7EB] text-[#33650E] text-[11px] font-bold shrink-0">
                Lab Report
              </span>
            </div>

            <div className="py-3.5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FFF0EF] text-[#A33837] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-['Plus_Jakarta_Sans'] text-[14px] font-bold text-[#0B0808]">
                      Allergy &amp; Asthma Center — Skin Prick &amp; Oral Challenge
                    </h4>
                  </div>
                  <p className="text-[12px] text-[#42493b] mt-0.5">
                    Negative Skin Prick &amp; Amoxicillin 250mg oral challenge passed.
                  </p>
                  <p className="text-[11px] text-[#667065] mt-1 font-mono">
                    18 Apr 2023 • Contradicts 2021 hospital allergy
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#FFF5E5] text-[#985C12] text-[11px] font-bold shrink-0">
                Discrepancy
              </span>
            </div>

            <div className="py-3.5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F2F7EB] text-[#33650E] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">description</span>
                </div>
                <div>
                  <h4 className="font-['Plus_Jakarta_Sans'] text-[14px] font-bold text-[#0B0808]">
                    Memorial Hospital — Discharge Summary (Bronchitis)
                  </h4>
                  <p className="text-[12px] text-[#42493b] mt-0.5">
                    Noted penicillin allergy hives. Metformin 500mg daily initiated.
                  </p>
                  <p className="text-[11px] text-[#667065] mt-1 font-mono">
                    12 Oct 2021 • Discharge_Summary_Oct21.pdf
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#F2F7EB] text-[#33650E] text-[11px] font-bold shrink-0">
                Consultation
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
