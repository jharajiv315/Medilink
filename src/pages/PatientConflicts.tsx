import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import type { DiscrepancyConflict } from '../types/medilink.ts';

interface PatientConflictsProps {
  onNavigate: (path: string) => void;
}

export const PatientConflicts: React.FC<PatientConflictsProps> = ({ onNavigate }) => {
  const { currentUser, getAuthHeaders } = useAuth();
  const patientId = currentUser.patientId!;

  const [conflicts, setConflicts] = useState<DiscrepancyConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientNotes, setPatientNotes] = useState<Record<string, string>>({});
  const [isAffirming, setIsAffirming] = useState(false);
  const [affirmSuccess, setAffirmSuccess] = useState(false);
  const [error, setError] = useState('');

  const loadConflicts = () => {
    setError('');
    fetch(`/api/patients/${patientId}/conflicts`, {
      headers: getAuthHeaders()
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Unable to load discrepancies.');
        return data;
      })
      .then(data => {
        if (data.conflicts) {
          setConflicts(data.conflicts);
        }
        setLoading(false);
      })
      .catch(error => { setError(error.message || 'Unable to connect. Please try again.'); setLoading(false); });
  };

  useEffect(() => {
    loadConflicts();
  }, [patientId]);

  const handleAffirm = async (conflictId: string) => {
    const patientNote = patientNotes[conflictId]?.trim();
    if (!patientNote || isAffirming) return;
    setIsAffirming(true);
    setError('');
    try {
      const res = await fetch(`/api/patients/${patientId}/conflicts/${conflictId}/affirm`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ affirmationStatement: patientNote })
      });
      if (res.ok) {
        setAffirmSuccess(true);
        loadConflicts();
        setTimeout(() => setAffirmSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Your note could not be saved.');
      }
    } catch {
      setError('Unable to connect. Your note was not saved.');
    } finally {
      setIsAffirming(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 py-8 space-y-8">
      {error && <div role="alert" className="rounded-2xl border border-[#A33837]/20 bg-[#FFF0EF] p-4 text-sm text-[#A33837]">{error} <button onClick={loadConflicts} className="ml-2 font-bold underline">Reload</button></div>}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#DFE5D8]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5E5] text-[#985C12] text-[11px] font-bold border border-[#985C12]/20 mb-2">
            <span className="material-symbols-outlined text-[14px]">warning</span>
            <span>Evidence-Linked Discrepancy Engine</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-[28px] sm:text-[34px] font-bold text-[#0B0808]">
            Clinical Documentation Discrepancies
          </h1>
          <p className="font-['DM_Sans'] text-[15px] text-[#42493b] mt-1">
            Automated cross-encounter analysis highlighting clinical contradictions with source-level
            citations.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/patient/consents')}
          className="inline-flex items-center gap-2 bg-[#33650E] hover:bg-[#28510B] text-[#FFFFFF] text-[14px] font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">medical_services</span>
          <span>Manage sharing</span>
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-[#667065]">Analyzing clinical records for conflicts...</div>
      ) : error ? null : conflicts.length === 0 ? (
        <div className="p-10 text-center bg-[#FFFFFF] rounded-2xl border border-[#DFE5D8]">
          <span className="material-symbols-outlined text-[#33650E] text-[40px] mb-2">
            check_circle
          </span>
          <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[#0B0808]">
            No Active Discrepancies
          </h3>
          <p className="text-[14px] text-[#42493b] mt-1">
            All medical records and allergy assertions across providers are consistent.
          </p>
        </div>
      ) : (
        conflicts.map(conflict => {
          const isReconciled = conflict.status === 'clinician_reconciled';
          const isAffirmed = conflict.status === 'patient_affirmed' || conflict.patientAffirmation?.affirmed;

          return (
            <div
              key={conflict.id}
              className="bg-[#FFFFFF] rounded-3xl border border-[#DFE5D8] p-6 sm:p-8 shadow-sm space-y-6"
            >
              {/* Card Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F4F5F1]">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                      isReconciled
                        ? 'bg-[#F2F7EB] text-[#33650E]'
                        : 'bg-[#FFF0EF] text-[#A33837]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">
                      {isReconciled ? 'check_circle' : 'warning'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[#0B0808]">
                      {conflict.title}
                    </h3>
                    <p className="text-[12px] text-[#667065]">
                      Concept Key: <span className="font-mono">{conflict.conceptKey}</span> •
                      Significance: <span className="capitalize font-bold text-[#A33837]">{conflict.clinicalSignificance}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold border transition-colors ${
                      isReconciled
                        ? 'bg-[#EDF6E6] text-[#33650E] border-[#D0E4B6]'
                        : isAffirmed
                        ? 'bg-[#F2F7EB] text-[#285208] border-[#D0E4B6]'
                        : 'bg-[#FFF5E5] text-[#985C12] border-[#F2D4A8]'
                    }`}
                  >
                    {isReconciled
                      ? 'Reconciled by Clinician'
                      : isAffirmed
                      ? 'Patient Affirmed'
                      : 'Documentation discrepancy — clinical review required'}
                  </span>
                </div>
              </div>

              {/* Explanation Text */}
              <p className="font-['DM_Sans'] text-[14px] text-[#42493b] bg-[#F4F5F1] p-4 rounded-xl border border-[#DFE5D8]">
                {conflict.explanation}
              </p>

              {/* Side-by-Side Evidence Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Source A */}
                <div className="bg-[#F2F7EB] p-5 rounded-2xl border border-[#DFE5D8] flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#33650E] text-[18px]">
                          domain
                        </span>
                        <span className="font-['Plus_Jakarta_Sans'] text-[13px] font-bold text-[#0B0808]">
                          {conflict.factA.sourceOrgName}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-[#A33837] bg-[#FFF0EF] px-2.5 py-0.5 rounded-full">
                        {conflict.factA.clinicalDate}
                      </span>
                    </div>

                    <h4 className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[#0B0808]">
                      {conflict.factA.assertion}
                    </h4>

                    <div className="mt-2 p-3 bg-[#FFFFFF] rounded-xl border border-[#DFE5D8] text-[13px] text-[#42493b] italic">
                      "{conflict.factA.evidenceQuote}"
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#DFE5D8] flex items-center justify-between text-[11px] text-[#667065] font-mono">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">attachment</span>
                      <span>{conflict.factA.documentTitle}</span>
                    </span>
                    <span>Page {conflict.factA.sourcePage || 1}</span>
                  </div>
                </div>

                {/* Source B */}
                <div className="bg-[#F2F7EB] p-5 rounded-2xl border border-[#DFE5D8] flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#33650E] text-[18px]">
                          domain
                        </span>
                        <span className="font-['Plus_Jakarta_Sans'] text-[13px] font-bold text-[#0B0808]">
                          {conflict.factB.sourceOrgName}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-[#33650E] bg-[#FFFFFF] px-2.5 py-0.5 rounded-full border border-[#DFE5D8]">
                        {conflict.factB.clinicalDate}
                      </span>
                    </div>

                    <h4 className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[#0B0808]">
                      {conflict.factB.assertion}
                    </h4>

                    <div className="mt-2 p-3 bg-[#FFFFFF] rounded-xl border border-[#DFE5D8] text-[13px] text-[#42493b] italic">
                      "{conflict.factB.evidenceQuote}"
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#DFE5D8] flex items-center justify-between text-[11px] text-[#667065] font-mono">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">attachment</span>
                      <span>{conflict.factB.documentTitle}</span>
                    </span>
                    <span>Page {conflict.factB.sourcePage || 1}</span>
                  </div>
                </div>
              </div>

              {/* Patient Affirmation Section */}
              <div className="bg-[#F4F5F1] p-5 rounded-2xl border border-[#DFE5D8] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#33650E] text-[20px]">
                      person_check
                    </span>
                    <span className="font-['Plus_Jakarta_Sans'] text-[14px] font-bold text-[#0B0808]">
                      Patient Lived Experience Affirmation
                    </span>
                  </div>
                  {isAffirmed && (
                    <span className="text-[11px] font-bold text-[#33650E] bg-[#F2F7EB] px-2.5 py-0.5 rounded-full border border-[#DFE5D8]">
                      Affirmed on {conflict.patientAffirmation?.timestamp.split('T')[0]}
                    </span>
                  )}
                </div>

                <p className="text-[12px] text-[#42493b]">
                  Patients can clarify whether they have experienced symptoms during past oral
                  challenges or antibiotic courses before the physician consultation.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <input
                    type="text"
                    aria-label={`Your statement for ${conflict.title}`}
                    maxLength={10000}
                    value={patientNotes[conflict.id] || ''}
                    onChange={e => setPatientNotes(previous => ({ ...previous, [conflict.id]: e.target.value }))}
                    placeholder="Enter your symptom confirmation or recollection..."
                    className="flex-1 px-3.5 py-2 bg-[#FFFFFF] border border-[#DFE5D8] rounded-xl text-[13px] text-[#0B0808] focus:outline-none focus:border-[#33650E]"
                  />
                  <button
                    onClick={() => handleAffirm(conflict.id)}
                    disabled={isAffirming || isReconciled || !patientNotes[conflict.id]?.trim()}
                    className="bg-[#33650E] hover:bg-[#28510B] text-[#FFFFFF] text-[13px] font-semibold px-5 py-2 rounded-xl transition-all shadow-sm shrink-0"
                  >
                    {isAffirming ? 'Saving...' : 'Affirm for Clinician'}
                  </button>
                </div>

                {affirmSuccess && (
                  <p className="text-[12px] font-bold text-[#33650E] animate-in fade-in">
                    ✓ Your affirmation statement was recorded in the clinical ledger.
                  </p>
                )}
              </div>

              {/* Clinician Reconciliation Status */}
              {isReconciled ? (
                <div className="bg-[#F2F7EB] p-5 rounded-2xl border-2 border-[#78A541] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[#33650E] font-bold text-[14px]">
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      <span>Mark Reconciled by Consulting Clinician</span>
                    </span>
                    <span className="text-[11px] text-[#667065] font-mono">
                      {conflict.clinicianReview?.timestamp.split('T')[0]}
                    </span>
                  </div>
                  <p className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[#0B0808]">
                    {conflict.clinicianReview?.clinicalResolution}
                  </p>
                  <p className="text-[13px] text-[#42493b] italic">
                    "{conflict.clinicianReview?.rationale}"
                  </p>
                  <div className="pt-2 text-[11px] text-[#667065] border-t border-[#DFE5D8] flex items-center justify-between">
                    <span>
                      Signed by: <strong>{conflict.clinicianReview?.reviewerName}</strong> ({conflict.clinicianReview?.reviewerOrg})
                    </span>
                    <span className="text-[#33650E] font-semibold">FHIR Continuity Updated</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <p className="text-[12px] text-[#667065]">
                    Physicians can review source documents and sign off on this discrepancy during the
                    Clinical Handoff.
                  </p>
                  {patientId === 'DEMO-P001' && <button
                    onClick={() => onNavigate('/clinic/handoff/grant-sutter-01')}
                    className="bg-[#F2F7EB] hover:bg-[#ebefe4] text-[#33650E] border border-[#DFE5D8] font-semibold text-[13px] px-4 py-2 rounded-xl transition-colors shrink-0"
                  >
                    Open Clinical Handoff Form →
                  </button>}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
