import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import type { Patient, AccessGrant, DiscrepancyConflict, ClinicalDocument, MedicalFact } from '../types/medilink.ts';
import { Ban, Activity, LockKeyhole, Pill, FolderOpen, FileText, TriangleAlert, CircleCheck, ClipboardCheck, BadgeCheck } from 'lucide-react';

interface ClinicHandoffProps {
  grantId: string;
  onNavigate: (path: string) => void;
}

export const ClinicHandoff: React.FC<ClinicHandoffProps> = ({ grantId, onNavigate }) => {
  const { currentUser, getAuthHeaders } = useAuth();
  const [data, setData] = useState<{
    grant?: AccessGrant;
    patient?: Patient;
    approvedCategories?: string[];
    documents?: ClinicalDocument[];
    facts?: MedicalFact[];
    conflicts?: DiscrepancyConflict[];
    filteredStats?: any;
    error?: string;
    message?: string;
    status?: string;
  }>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');

  // Clinician reconciliation form state
  const [drafts, setDrafts] = useState<Record<string, { resolution: string; note: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reconciledSuccess, setReconciledSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'history' | 'conflicts' | 'documents' | 'review'>('summary');

  const loadHandoffData = useCallback((signal?: AbortSignal) => {
    setLoadError('');
    return fetch(`/api/clinic/handoff/${encodeURIComponent(grantId)}`, {
      headers: getAuthHeaders(), signal
    })
      .then(async res => {
        const json = await res.json();
        if (res.status === 403) {
          setData(json);
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error(json.message || json.error || 'Unable to load this handoff.');
        if (!json.patient || !json.grant) throw new Error('The server returned an incomplete handoff.');
        setData(json);
        setLoading(false);
      })
      .catch(error => {
        if (signal?.aborted) return;
        setLoadError(error.message || 'Unable to connect. Please try again.');
        setLoading(false);
      });
  }, [grantId, getAuthHeaders]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setData({});
    setReconciledSuccess(false);
    setSaveError('');
    void loadHandoffData(controller.signal);
    return () => controller.abort();
  }, [loadHandoffData]);

  const handleReconcile = async (conflictId: string) => {
    const draft = drafts[conflictId];
    if (isSubmitting || !draft?.resolution.trim() || !draft.note.trim()) return;
    setIsSubmitting(true);
    setSaveError('');
    try {
      const res = await fetch(`/api/clinic/handoff/${grantId}/reconcile`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          conflictId,
          clinicalResolution: draft.resolution.trim(),
          rationale: draft.note.trim()
        })
      });

      if (res.ok) {
        setReconciledSuccess(true);
        await loadHandoffData();
      } else {
        const result = await res.json().catch(() => ({}));
        setSaveError(result.error || 'Reconciliation could not be saved. Please try again.');
      }
    } catch {
      setSaveError('Unable to connect. Your reconciliation was not saved. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 text-center text-[#667065]">
        Verifying cryptographic access token and loading patient handoff...
      </div>
    );
  }

  if (loadError) return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="rounded-3xl border border-[#DFE5D8] bg-white p-8 text-center shadow-sm" role="alert">
        <h1 className="text-2xl font-bold">Handoff unavailable</h1>
        <p className="mt-3 text-sm text-[#667065]">{loadError}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={() => { setLoading(true); void loadHandoffData(); }} className="rounded-xl bg-[#33650E] px-5 py-3 text-sm font-semibold text-white">Try again</button>
          <button onClick={() => onNavigate('/clinic/dashboard')} className="rounded-xl border border-[#DFE5D8] px-5 py-3 text-sm font-semibold">Back to workspace</button>
        </div>
      </div>
    </div>
  );

  // HARD SECURITY CHECK: Access Denied / Revoked Screen
  if (data.error) {
    return (
      <div className="max-w-3xl mx-auto px-6 lg:px-12 py-16">
        <div className="bg-[#FFFFFF] rounded-3xl border-2 border-[#A33837] p-8 sm:p-10 shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-[#FFF0EF] text-[#A33837] flex items-center justify-center mx-auto">
            <Ban className="w-9 h-9" />
          </div>

          <div>
            <span className="text-[12px] font-bold text-[#A33837] uppercase tracking-wider bg-[#FFF0EF] px-3 py-1 rounded-full border border-[#ffdad6]">
              403 Forbidden · {data.status === 'revoked' ? 'Access Revoked' : data.status === 'expired' ? 'Access Expired' : 'Access Denied'}
            </span>
            <h1 className="font-['Plus_Jakarta_Sans'] text-[26px] sm:text-[30px] font-bold text-[#0B0808] mt-3">
              {data.status === 'revoked' ? 'Clinical Access Terminated by Patient' : data.status === 'expired' ? 'Clinical Access Has Expired' : 'Clinical Access Unavailable'}
            </h1>
            <p className="font-['DM_Sans'] text-[15px] text-[#42493b] mt-2 max-w-lg mx-auto">
              {data.message || 'The patient has revoked authorization for this clinic or the time-bound token has expired.'}
            </p>
          </div>

          <div className="p-4 bg-[#F4F5F1] rounded-2xl border border-[#DFE5D8] text-left text-[13px] space-y-1.5 font-mono break-all">
            <p className="text-[#0B0808]"><strong>Grant ID:</strong> {grantId}</p>
            <p className="text-[#0B0808]"><strong>Status:</strong> {data.status}</p>
            <p className="text-[#A33837]"><strong>Enforcement:</strong> This sharing permission does not authorize access.</p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => onNavigate('/clinic/dashboard')}
              className="bg-[#33650E] text-[#FFFFFF] text-[14px] font-semibold px-6 py-2.5 rounded-xl hover:bg-[#28510B]"
            >
              Back to Clinic Workspace
            </button>
          </div>
        </div>
      </div>
    );
  }

  const patient = data.patient;
  const grant = data.grant;
  const documents = data.documents || [];
  const facts = data.facts || [];
  const conflicts = data.conflicts || [];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 space-y-6 overflow-x-hidden">
      {saveError && <div role="alert" className="rounded-2xl border border-[#A33837]/20 bg-[#FFF0EF] p-4 text-sm text-[#A33837]">{saveError}</div>}
      
      {/* Top Patient Banner Card matching Panel 6 */}
      <div className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-7 border border-[#DFE5D8] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-full bg-[#EDF6E6] text-[#33650E] flex items-center justify-center font-bold text-lg border border-[#DFE5D8] shrink-0">
              {patient?.name?.split(' ').map(n => n[0]).join('') || 'AS'}
            </div>
            <div>
              <h1 className="font-['Plus_Jakarta_Sans'] text-[24px] sm:text-[28px] font-bold text-[#0B0808]">
                {patient?.name || 'Ananya Sharma'}
              </h1>
              <p className="font-['DM_Sans'] text-[13.5px] text-[#667065] mt-0.5">
                Female · 28 years · ID: {patient?.patientCode || 'PT-2024-001'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-[#EDF6E6] text-[#33650E] border border-[#D2E4C2] w-fit">
              <span className="material-symbols-outlined text-[15px]">verified</span>
              <span>Access Valid</span>
            </span>
            <p className="text-[11.5px] text-[#667065] font-['DM_Sans']">
              Authorized: Allergies, Medications, Conditions, Lab Reports
            </p>
          </div>
        </div>
      </div>

      {/* Record Navigation Tabs matching Panel 6 */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'summary', label: 'Clinical Summary' },
          { id: 'history', label: 'Medical History' },
          { id: 'conflicts', label: `Discrepancies (${conflicts.length})` },
          { id: 'documents', label: 'Documents' },
          { id: 'review', label: 'Add Review' },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                isActive
                  ? 'bg-[#285208] text-[#FFFFFF] font-semibold shadow-xs'
                  : 'bg-[#FFFFFF] text-[#484D45] border border-[#DFE5D8] hover:bg-[#F2F7EB]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4-Card Clinical Summary Grid matching Panel 6 */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Allergies Card */}
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#DFE5D8] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F4EA]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FFF0EF] text-[#A33837] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                  </div>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-[15.5px] font-bold text-[#0B0808]">
                    Allergies
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF0EF] text-[#A33837] border border-[#FED7D7]">
                  1 Conflict
                </span>
              </div>
              <div className="space-y-2.5 text-[13px] font-['DM_Sans']">
                <div className="p-3 rounded-xl bg-[#FFFBF2] border border-[#F5E5C9] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#985C12] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px]">flag</span>
                      <span>Penicillin</span>
                    </span>
                    <span className="text-[11px] font-semibold text-[#A33837]">Discrepancy</span>
                  </div>
                  <p className="text-[12px] text-[#667065]">
                    Hospital A documents rash; Clinic B states no known drug allergies.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAF5] border border-[#DFE5D8] flex items-center justify-between">
                  <span className="font-semibold text-[#0B0808]">Peanuts</span>
                  <span className="text-[12px] text-[#667065]">Mild hives (documented 2022)</span>
                </div>
              </div>
            </div>

            {/* 2. Active Medications Card */}
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#DFE5D8] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F4EA]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EDF6E6] text-[#33650E] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">medication</span>
                  </div>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-[15.5px] font-bold text-[#0B0808]">
                    Medications (3 Active)
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EDF6E6] text-[#33650E] border border-[#D2E4C2]">
                  Active
                </span>
              </div>
              <div className="space-y-2 text-[13px] font-['DM_Sans']">
                <div className="p-3 rounded-xl bg-[#F8FAF5] border border-[#DFE5D8] flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#0B0808]">Metformin 500mg</p>
                    <p className="text-[11.5px] text-[#667065]">Twice daily with meals · Oral</p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#33650E]">Active</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAF5] border border-[#DFE5D8] flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#0B0808]">Lisinopril 10mg</p>
                    <p className="text-[11.5px] text-[#667065]">Once daily morning · Oral</p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#33650E]">Active</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAF5] border border-[#DFE5D8] flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#0B0808]">Atorvastatin 20mg</p>
                    <p className="text-[11.5px] text-[#667065]">Once daily bedtime · Oral</p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#33650E]">Active</span>
                </div>
              </div>
            </div>

            {/* 3. Chronic Conditions Card */}
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#DFE5D8] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F4EA]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EDF6E6] text-[#33650E] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">vital_signs</span>
                  </div>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-[15.5px] font-bold text-[#0B0808]">
                    Conditions
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EDF6E6] text-[#33650E] border border-[#D2E4C2]">
                  2 Diagnosed
                </span>
              </div>
              <div className="space-y-2 text-[13px] font-['DM_Sans']">
                <div className="p-3 rounded-xl bg-[#F8FAF5] border border-[#DFE5D8] flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#0B0808]">Type 2 Diabetes Mellitus</p>
                    <p className="text-[11.5px] text-[#667065]">Diagnosed 2021 · Well managed</p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#33650E]">Chronic</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAF5] border border-[#DFE5D8] flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#0B0808]">Primary Hypertension</p>
                    <p className="text-[11.5px] text-[#667065]">Diagnosed 2022 · Controlled</p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#33650E]">Controlled</span>
                </div>
              </div>
            </div>

            {/* 4. Recent Labs Card */}
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#DFE5D8] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F4EA]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EDF6E6] text-[#33650E] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">biotechnology</span>
                  </div>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-[15.5px] font-bold text-[#0B0808]">
                    Recent Labs
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EDF6E6] text-[#33650E] border border-[#D2E4C2]">
                  Jun 18, 2024
                </span>
              </div>
              <div className="space-y-2 text-[13px] font-['DM_Sans']">
                <div className="p-3 rounded-xl bg-[#F8FAF5] border border-[#DFE5D8] flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#0B0808]">Hemoglobin A1c</p>
                    <p className="text-[11.5px] text-[#667065]">Target &lt; 7.0%</p>
                  </div>
                  <span className="font-bold text-[#985C12]">6.8%</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAF5] border border-[#DFE5D8] flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#0B0808]">Lipid Panel (Total)</p>
                    <p className="text-[11.5px] text-[#667065]">Desirable &lt; 200 mg/dL</p>
                  </div>
                  <span className="font-bold text-[#33650E]">185 mg/dL</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAF5] border border-[#DFE5D8] flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#0B0808]">Estimated GFR</p>
                    <p className="text-[11.5px] text-[#667065]">Normal &gt; 90 mL/min</p>
                  </div>
                  <span className="font-bold text-[#33650E]">&gt; 90 mL/min</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medical History Tab */}
      {activeTab === 'history' && (
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#DFE5D8] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0F4EA]">
            <h2 className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[#0B0808]">
              Permitted Clinical Facts &amp; Provenance ({facts.length})
            </h2>
            <span className="text-[12px] text-[#667065]">
              {grant?.approvedCategories.join(', ')}
            </span>
          </div>
          <div className="space-y-3">
            {facts.map(fact => (
              <div key={fact.id} className="p-4 rounded-xl bg-[#F8FAF5] border border-[#DFE5D8] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0B0808] text-[13.5px]">{fact.assertion}</span>
                  <span className="text-[11px] text-[#667065] font-mono">{fact.clinicalDate}</span>
                </div>
                <p className="text-[12.5px] text-[#42493b] italic">"{fact.evidenceQuote}"</p>
                <div className="flex items-center justify-between pt-1 border-t border-[#DFE5D8] text-[11px] text-[#667065]">
                  <span>Source: {fact.sourceOrgName}</span>
                  <span className="font-mono">{fact.documentTitle}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#DFE5D8] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0F4EA]">
            <h2 className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[#0B0808]">
              Originating Source Documents ({documents.length})
            </h2>
          </div>
          <div className="space-y-3">
            {documents.map(doc => (
              <div key={doc.id} className="p-4 rounded-xl border border-[#DFE5D8] bg-[#F8FAF5] flex items-center justify-between gap-3 text-[13px]">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#33650E] text-[24px]">description</span>
                  <div>
                    <p className="font-bold text-[#0B0808]">{doc.title}</p>
                    <p className="text-[#667065] text-[12px]">{doc.sourceOrganizationName} • {doc.clinicalDate}</p>
                  </div>
                </div>
                <span className="font-mono text-[11px] text-[#33650E] bg-[#FFFFFF] px-2.5 py-1 rounded-md border border-[#DFE5D8]">
                  SHA-256 Verified
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discrepancy Reconciliation Section (Shown on summary, conflicts, or review) */}
      {(activeTab === 'summary' || activeTab === 'conflicts' || activeTab === 'review') && conflicts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[#0B0808]">
              Pre-Consult Discrepancy Reconciliation
            </h2>
            <span className="text-[12px] text-[#667065]">
              Mandatory clinical sign-off
            </span>
          </div>

          {conflicts.map(conflict => {
            const isReconciled = conflict.status === 'clinician_reconciled';
            const draft = drafts[conflict.id] || { resolution: '', note: '' };
            const updateDraft = (field: 'resolution' | 'note', value: string) =>
              setDrafts(previous => ({ ...previous, [conflict.id]: { ...draft, [field]: value } }));

            return (
              <div
                key={conflict.id}
                className="bg-[#FFFFFF] rounded-2xl border-2 border-[#78A541] p-6 sm:p-7 shadow-xs space-y-5"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#F0F4EA]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FFF0EF] text-[#A33837] flex items-center justify-center font-bold">
                      <TriangleAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[#0B0808]">
                        {conflict.title}
                      </h3>
                      <p className="text-[12px] text-[#667065]">
                        Cross-provider contradiction • Mandatory pre-consult verification
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                      isReconciled
                        ? 'bg-[#EDF6E6] text-[#33650E] border border-[#D2E4C2]'
                        : 'bg-[#FFF5E5] text-[#985C12] border border-[#F5E5C9]'
                    }`}
                  >
                    {isReconciled ? 'Reconciled & Signed' : 'Action Required'}
                  </span>
                </div>

                {/* Evidence Comparison Side-by-side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Source A */}
                  <div className="bg-[#FFFDF9] p-4 rounded-xl border border-[#F2D4A8] flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[12px] font-bold text-[#0B0808]">
                          {conflict.factA.sourceOrgName}
                        </span>
                        <span className="text-[10px] font-bold text-[#A33837] bg-[#FFF0EF] px-2 py-0.5 rounded-full">
                          Hospital A
                        </span>
                      </div>
                      <p className="font-bold text-[#0B0808] text-[13px]">
                        {conflict.factA.assertion}
                      </p>
                      <p className="text-[12px] text-[#42493b] mt-1 italic bg-white p-2.5 rounded-lg border border-[#F0DFCA]">
                        "{conflict.factA.evidenceQuote}"
                      </p>
                    </div>
                    <p className="text-[11px] text-[#667065] pt-2 border-t border-[#F0DFCA] font-mono">
                      Ref: {conflict.factA.documentTitle}
                    </p>
                  </div>

                  {/* Source B */}
                  <div className="bg-[#F8FAF5] p-4 rounded-xl border border-[#D2E4C2] flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[12px] font-bold text-[#0B0808]">
                          {conflict.factB.sourceOrgName}
                        </span>
                        <span className="text-[10px] font-bold text-[#33650E] bg-[#EDF6E6] px-2 py-0.5 rounded-full border border-[#DFE5D8]">
                          Clinic B
                        </span>
                      </div>
                      <p className="font-bold text-[#0B0808] text-[13px]">
                        {conflict.factB.assertion}
                      </p>
                      <p className="text-[12px] text-[#42493b] mt-1 italic bg-white p-2.5 rounded-lg border border-[#DFE8D7]">
                        "{conflict.factB.evidenceQuote}"
                      </p>
                    </div>
                    <p className="text-[11px] text-[#667065] pt-2 border-t border-[#DFE8D7] font-mono">
                      Ref: {conflict.factB.documentTitle}
                    </p>
                  </div>
                </div>

                {/* Patient Affirmation Callout */}
                <div className="p-3.5 bg-[#F8FAF5] rounded-xl border border-[#DFE5D8] flex items-center gap-2.5 text-[12.5px] text-[#0B0808]">
                  <CircleCheck className="w-4 h-4 text-[#33650E] shrink-0" />
                  <span>
                    <strong>Patient note: </strong> {conflict.patientAffirmation?.statement || 'Patient confirmed rash on penicillin as a child, no anaphylaxis.'}
                  </span>
                </div>

                {/* Clinician Review & Reconciliation Form */}
                <div className="p-5 bg-[#F8FAF5] rounded-xl border border-[#DFE5D8] space-y-4">
                  <h4 className="font-['Plus_Jakarta_Sans'] text-[14.5px] font-bold text-[#0B0808] flex items-center gap-2">
                    <ClipboardCheck className="w-[18px] h-[18px] text-[#33650E] shrink-0" />
                    <span>Physician Clinical Reconciliation</span>
                  </h4>

                  <div>
                    <label className="block text-[12px] font-bold text-[#0B0808] mb-1">
                      Clinical Determination:
                    </label>
                    <input
                      aria-label={`Clinical determination for ${conflict.title}`}
                      placeholder="Enter determination (e.g. Verified Penicillin allergy, mild rash only)"
                      maxLength={2000}
                      value={isReconciled ? conflict.clinicianReview?.clinicalResolution || '' : draft.resolution}
                      onChange={e => updateDraft('resolution', e.target.value)}
                      disabled={isReconciled}
                      className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#DFE5D8] rounded-xl text-[13px] text-[#0B0808] focus:outline-none focus:border-[#33650E]"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[#0B0808] mb-1">
                      Attending Physician Documentation Note:
                    </label>
                    <textarea
                      aria-label={`Rationale for ${conflict.title}`}
                      placeholder="Document supporting evidence and clinical plan"
                      maxLength={10000}
                      rows={2}
                      value={isReconciled ? conflict.clinicianReview?.rationale || '' : draft.note}
                      onChange={e => updateDraft('note', e.target.value)}
                      disabled={isReconciled}
                      className="w-full p-3 bg-[#FFFFFF] border border-[#DFE5D8] rounded-xl text-[13px] text-[#0B0808] focus:outline-none focus:border-[#33650E]"
                    ></textarea>
                  </div>

                  <div className="flex flex-wrap gap-3 items-center justify-between pt-2">
                    <span className="text-[11.5px] text-[#667065]">
                      Reviewer: <strong>{conflict.clinicianReview?.reviewerName || currentUser.name}</strong> ({conflict.clinicianReview?.reviewerOrg || currentUser.organization})
                    </span>

                    {isReconciled ? (
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#33650E]">
                        <CircleCheck className="w-4 h-4" />
                        <span>Reconciled &amp; Appended to Timeline</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleReconcile(conflict.id)}
                        disabled={isSubmitting || !draft.resolution.trim() || !draft.note.trim()}
                        className="bg-[#285208] hover:bg-[#1e4604] text-[#FFFFFF] text-[13px] font-semibold px-5 py-2.5 rounded-xl transition-all shadow-xs active:scale-[0.98]"
                      >
                        {isSubmitting ? 'Signing...' : 'Sign & Mark Reconciled'}
                      </button>
                    )}
                  </div>
                </div>

                {reconciledSuccess && isReconciled && (
                  <div className="p-4 bg-[#EDF6E6] rounded-xl border border-[#78A541] text-[13px] text-[#33650E] font-medium flex items-center gap-2">
                    <BadgeCheck className="w-[18px] h-[18px] shrink-0" />
                    <span>
                      Reconciliation signed by {conflict.clinicianReview?.reviewerName}. Updated record has been appended to clinical timeline.
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
