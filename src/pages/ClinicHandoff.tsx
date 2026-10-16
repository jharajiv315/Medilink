import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import type { Patient, AccessGrant, DiscrepancyConflict, ClinicalDocument, MedicalFact } from '../types/medilink.ts';

interface ClinicHandoffProps {
  grantId: string;
  onNavigate: (path: string) => void;
}

export const ClinicHandoff: React.FC<ClinicHandoffProps> = ({ grantId, onNavigate }) => {
  const { currentUser, switchUser, getAuthHeaders } = useAuth();
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

  // Clinician reconciliation form state
  const [resolutionChoice, setResolutionChoice] = useState(
    'De-labeled Penicillin Allergy (Safe for Cephalosporin & Penicillin administration)'
  );
  const [clinicianNote, setClinicianNote] = useState(
    'Patient completed formal skin prick and 250mg oral amoxicillin challenge at Allergy & Asthma Center with zero reaction. Verified non-IgE mediated childhood history. De-labeled for future prescribing.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reconciledSuccess, setReconciledSuccess] = useState(false);

  const loadHandoffData = () => {
    const headers = getAuthHeaders();
    if (currentUser.role !== 'clinician' && currentUser.role !== 'admin') {
      headers['x-medilink-demo-user'] = 'user-dr-vance';
    }
    fetch(`/api/clinic/handoff/${grantId}`, {
      headers
    })
      .then(async res => {
        const json = await res.json();
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadHandoffData();
  }, [grantId]);

  const handleReconcile = async (conflictId: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/clinic/handoff/${grantId}/reconcile`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          conflictId,
          clinicalResolution: resolutionChoice,
          rationale: clinicianNote
        })
      });

      if (res.ok) {
        setReconciledSuccess(true);
        loadHandoffData();
      } else {
        alert('Reconciliation failed.');
      }
    } catch {
      alert('Error saving reconciliation to clinical ledger.');
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

  // HARD SECURITY CHECK: Access Denied / Revoked Screen
  if (data.error) {
    return (
      <div className="max-w-3xl mx-auto px-6 lg:px-12 py-16">
        <div className="bg-[#FFFFFF] rounded-3xl border-2 border-[#A33837] p-8 sm:p-10 shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-[#FFF0EF] text-[#A33837] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[36px]">block</span>
          </div>

          <div>
            <span className="text-[12px] font-bold text-[#A33837] uppercase tracking-wider bg-[#FFF0EF] px-3 py-1 rounded-full border border-[#ffdad6]">
              403 Forbidden • Access Revoked
            </span>
            <h1 className="font-['Plus_Jakarta_Sans'] text-[26px] sm:text-[30px] font-bold text-[#0B0808] mt-3">
              Clinical Access Terminated by Patient
            </h1>
            <p className="font-['DM_Sans'] text-[15px] text-[#42493b] mt-2 max-w-lg mx-auto">
              {data.message || 'The patient has revoked authorization for this clinic or the time-bound token has expired.'}
            </p>
          </div>

          <div className="p-4 bg-[#F4F5F1] rounded-2xl border border-[#DFE5D8] text-left text-[13px] space-y-1.5 font-mono">
            <p className="text-[#0B0808]"><strong>Grant ID:</strong> {grantId}</p>
            <p className="text-[#0B0808]"><strong>Status:</strong> {data.status}</p>
            <p className="text-[#A33837]"><strong>Enforcement:</strong> Cryptographic token invalidated at patient gateway.</p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-4">
            {currentUser.role !== 'clinician' && (
              <button
                onClick={async () => {
                  await switchUser('user-dr-vance');
                  loadHandoffData();
                }}
                className="bg-[#184620] hover:bg-[#113317] text-[#FFFFFF] text-[14px] font-semibold px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">stethoscope</span>
                <span>Switch to Dr. Marcus Vance &amp; Unlock</span>
              </button>
            )}
            <button
              onClick={() => onNavigate('/clinic/dashboard')}
              className="bg-[#33650E] text-[#FFFFFF] text-[14px] font-semibold px-6 py-2.5 rounded-xl hover:bg-[#28510B]"
            >
              Back to Clinic Workspace
            </button>
            <button
              onClick={() => onNavigate('/patient/access-history')}
              className="bg-[#F2F7EB] text-[#33650E] border border-[#DFE5D8] text-[14px] font-semibold px-5 py-2.5 rounded-xl"
            >
              Inspect Audit Log
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8 space-y-6 overflow-x-hidden">
      {/* Top Clinical Banner */}
      <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#DFE5D8] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#F2F7EB] text-[#33650E] flex items-center justify-center font-bold text-[18px]">
            AS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[#0B0808]">
                {patient?.name}
              </h1>
              <span className="text-[11px] font-mono bg-[#F2F7EB] text-[#33650E] font-bold px-2 py-0.5 rounded-full border border-[#DFE5D8]">
                {patient?.patientCode}
              </span>
              <span className="text-[12px] text-[#667065]">
                • DOB: {patient?.birthDate} (38yo F) • MRN: {patient?.mrn}
              </span>
            </div>
            <p className="text-[12px] text-[#42493b] mt-0.5">
              Conditions: {patient?.conditions.join(', ')} • PCP: {patient?.primaryCarePhysician}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <span className="px-3 py-1 rounded-full bg-[#F2F7EB] text-[#33650E] font-bold border border-[#DFE5D8]">
            Grant Active (30d pass)
          </span>
          <span className="text-[#667065]">
            Expires: {grant?.expiresAt?.split('T')[0]}
          </span>
          <button
            onClick={() => onNavigate('/clinic/dashboard')}
            className="text-[#33650E] font-bold hover:underline ml-2"
          >
            ← Exit Workspace
          </button>
        </div>
      </div>

      {/* TWO-PANE CLINICAL WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= LEFT PANE: PATIENT CLINICAL HISTORY & LABS ================= */}
        <div className="lg:col-span-6 space-y-6">
          {/* Active Diagnoses & Vitals Card */}
          {grant?.approvedCategories.includes('Consultations') ? (
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#DFE5D8] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F4F5F1]">
                <h2 className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[#0B0808] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#33650E] text-[18px]">
                    vital_signs
                  </span>
                  <span>Active Conditions &amp; Clinical Baseline</span>
                </h2>
                <span className="text-[11px] font-bold text-[#33650E] bg-[#F2F7EB] px-2 py-0.5 rounded-full">
                  FHIR R4 Verified
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                <div className="p-3 rounded-xl bg-[#F4F5F1] border border-[#DFE5D8]">
                  <span className="text-[11px] text-[#667065] font-bold uppercase block">
                    Endocrine Status
                  </span>
                  <p className="font-bold text-[#0B0808] mt-0.5">Type 2 Diabetes Mellitus</p>
                  <p className="text-[11px] text-[#42493b]">Latest HbA1c: 6.8% (Sep 2026)</p>
                </div>

                <div className="p-3 rounded-xl bg-[#F4F5F1] border border-[#DFE5D8]">
                  <span className="text-[11px] text-[#667065] font-bold uppercase block">
                    Cardiovascular Status
                  </span>
                  <p className="font-bold text-[#0B0808] mt-0.5">Essential Hypertension</p>
                  <p className="text-[11px] text-[#42493b]">Controlled on Lisinopril 10mg</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#DFE5D8] p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-[#667065]">
                <span className="text-[13px] font-bold flex items-center gap-1.5 text-[#0B0808]">
                  <span className="material-symbols-outlined text-[18px] text-[#985C12]">lock</span>
                  Conditions &amp; Diagnoses
                </span>
                <span className="text-[11px] font-mono bg-[#FFF5E5] text-[#985C12] px-2 py-0.5 rounded border border-[#985C12]/20">
                  Not available (Excluded from grant)
                </span>
              </div>
              <p className="text-[12px] text-[#42493b]">
                Patient granted access to: <strong>{grant?.approvedCategories.join(', ') || 'None'}</strong>. Baseline chronic conditions are withheld per minimal data policy.
              </p>
            </div>
          )}

          {/* Active Medications & Lab Panels */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#DFE5D8] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F4F5F1]">
              <h2 className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[#0B0808] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#33650E] text-[18px]">
                  medication
                </span>
                <span>Permitted Clinical Records &amp; Provenance</span>
              </h2>
              <span className="text-[11px] text-[#667065]">
                {facts.length} Permitted Facts
              </span>
            </div>

            {facts.length === 0 ? (
              <div className="p-6 text-center bg-[#F4F5F1] rounded-xl border border-[#DFE5D8] space-y-1">
                <p className="text-[13px] font-bold text-[#0B0808]">No records in authorized scopes</p>
                <p className="text-[12px] text-[#667065]">
                  Medications and labs are not available under this scoped grant ({grant?.approvedCategories.join(', ')}).
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {facts.map(fact => (
                  <div
                    key={fact.id}
                    className="p-3.5 rounded-xl bg-[#F2F7EB] border border-[#DFE5D8] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-['Plus_Jakarta_Sans'] text-[13px] font-bold text-[#0B0808]">
                        {fact.assertion}
                      </span>
                      <span className="text-[11px] font-mono text-[#667065]">
                        {fact.clinicalDate}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#42493b] italic">
                      "{fact.evidenceQuote}"
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-[#DFE5D8] text-[11px] text-[#667065]">
                      <span>Source: {fact.sourceOrgName}</span>
                      <span className="font-mono">{fact.documentTitle}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Original Source Documents */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#DFE5D8] p-6 shadow-sm space-y-4">
            <h2 className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[#0B0808] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#33650E] text-[18px]">
                folder_managed
              </span>
              <span>Originating Source Documents ({documents.length})</span>
            </h2>

            <div className="space-y-2.5">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className="p-3 rounded-xl border border-[#DFE5D8] bg-[#F4F5F1] flex items-center justify-between gap-3 text-[12px]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#33650E] text-[20px]">
                      picture_as_pdf
                    </span>
                    <div>
                      <p className="font-bold text-[#0B0808]">{doc.title}</p>
                      <p className="text-[#667065] text-[11px]">
                        {doc.sourceOrganizationName} • {doc.clinicalDate}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-[#33650E] bg-[#FFFFFF] px-2 py-0.5 rounded border border-[#DFE5D8] hidden sm:inline">
                    SHA-256 Verified
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= RIGHT PANE: DISCREPANCY RECONCILIATION ================= */}
        <div className="lg:col-span-6 space-y-6">
          {conflicts.map(conflict => {
            const isReconciled = conflict.status === 'clinician_reconciled';

            return (
              <div
                key={conflict.id}
                className="bg-[#FFFFFF] rounded-3xl border-2 border-[#78A541] p-6 sm:p-8 shadow-sm space-y-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#F4F5F1]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FFF0EF] text-[#A33837] flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-[22px]">warning</span>
                    </div>
                    <div>
                      <h2 className="font-['Plus_Jakarta_Sans'] text-[17px] font-bold text-[#0B0808]">
                        {conflict.title}
                      </h2>
                      <p className="text-[12px] text-[#667065]">
                        Cross-provider contradiction • Mandatory pre-consult verification
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                      isReconciled
                        ? 'bg-[#F2F7EB] text-[#33650E]'
                        : 'bg-[#FFF5E5] text-[#985C12]'
                    }`}
                  >
                    {isReconciled ? 'Reconciled & Signed' : 'Action Required'}
                  </span>
                </div>

                {/* Evidence Comparison Side-by-side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Source A */}
                  <div className="bg-[#F2F7EB] p-4 rounded-xl border border-[#DFE5D8] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-[#42493b]">
                          {conflict.factA.sourceOrgName}
                        </span>
                        <span className="text-[10px] font-bold text-[#A33837] bg-[#FFF0EF] px-2 py-0.5 rounded-full">
                          Allergy Listed
                        </span>
                      </div>
                      <p className="font-bold text-[#0B0808] text-[13px]">
                        {conflict.factA.assertion}
                      </p>
                      <p className="text-[12px] text-[#42493b] mt-1 italic">
                        "{conflict.factA.evidenceQuote}"
                      </p>
                    </div>
                    <p className="text-[10px] text-[#667065] mt-3 pt-2 border-t border-[#DFE5D8] font-mono">
                      Ref: Discharge_Summary_Oct21.pdf
                    </p>
                  </div>

                  {/* Source B */}
                  <div className="bg-[#F2F7EB] p-4 rounded-xl border border-[#DFE5D8] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-[#42493b]">
                          {conflict.factB.sourceOrgName}
                        </span>
                        <span className="text-[10px] font-bold text-[#33650E] bg-[#FFFFFF] px-2 py-0.5 rounded-full border border-[#DFE5D8]">
                          Test Negative
                        </span>
                      </div>
                      <p className="font-bold text-[#0B0808] text-[13px]">
                        {conflict.factB.assertion}
                      </p>
                      <p className="text-[12px] text-[#42493b] mt-1 italic">
                        "{conflict.factB.evidenceQuote}"
                      </p>
                    </div>
                    <p className="text-[10px] text-[#667065] mt-3 pt-2 border-t border-[#DFE5D8] font-mono">
                      Ref: Lab_Report_SkinPrick_2023.pdf
                    </p>
                  </div>
                </div>

                {/* Patient Affirmation Callout */}
                <div className="p-3.5 bg-[#F4F5F1] rounded-xl border border-[#DFE5D8] flex items-center gap-2.5 text-[12px] text-[#0B0808]">
                  <span className="material-symbols-outlined text-[#33650E] text-[18px]">
                    check_circle
                  </span>
                  <span>
                    <strong>Patient Affirmed:</strong> "No symptoms upon amoxicillin re-challenge."
                  </span>
                </div>

                {/* Clinician Review & Reconciliation Form */}
                <div className="p-5 bg-[#F2F7EB] rounded-2xl border border-[#DFE5D8] space-y-4">
                  <h3 className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[#0B0808] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#33650E] text-[18px]">
                      rate_review
                    </span>
                    <span>Physician Clinical Reconciliation</span>
                  </h3>

                  <div>
                    <label className="block text-[12px] font-bold text-[#0B0808] mb-1">
                      Clinical Determination:
                    </label>
                    <select
                      value={resolutionChoice}
                      onChange={e => setResolutionChoice(e.target.value)}
                      disabled={isReconciled}
                      className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#DFE5D8] rounded-xl text-[13px] text-[#0B0808] focus:outline-none focus:border-[#33650E]"
                    >
                      <option value="De-labeled Penicillin Allergy (Safe for Cephalosporin & Penicillin administration)">
                        De-labeled Penicillin Allergy (Safe for Cephalosporin &amp; Penicillin)
                      </option>
                      <option value="Confirmed Sensitivity (Require Alternative Antimicrobial)">
                        Confirmed Sensitivity (Require Alternative Antimicrobial)
                      </option>
                      <option value="Temporary Avoidance Pending Follow-up Immunologist Repeat Challenge">
                        Temporary Avoidance Pending Follow-up Immunologist Challenge
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[#0B0808] mb-1">
                      Attending Physician Rationale &amp; Documentation Note:
                    </label>
                    <textarea
                      rows={3}
                      value={clinicianNote}
                      onChange={e => setClinicianNote(e.target.value)}
                      disabled={isReconciled}
                      className="w-full p-3 bg-[#FFFFFF] border border-[#DFE5D8] rounded-xl text-[13px] text-[#0B0808] focus:outline-none focus:border-[#33650E]"
                    ></textarea>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-[#667065]">
                      Reviewer: <strong>Dr. Marcus Vance, MD</strong> (Sutter Health)
                    </span>

                    {isReconciled ? (
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#33650E]">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        <span>Reconciled &amp; Appended to Timeline</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleReconcile(conflict.id)}
                        disabled={isSubmitting}
                        className="bg-[#33650E] hover:bg-[#28510B] text-[#FFFFFF] text-[13px] font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-[0.98]"
                      >
                        {isSubmitting ? 'Signing...' : 'Sign & Mark Reconciled'}
                      </button>
                    )}
                  </div>
                </div>

                {reconciledSuccess && (
                  <div className="p-4 bg-[#F2F7EB] rounded-xl border border-[#78A541] text-[13px] text-[#33650E] font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>
                      Reconciliation signed by Dr. Marcus Vance. Updated record has been transmitted
                      to patient's timeline and audit ledger.
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
