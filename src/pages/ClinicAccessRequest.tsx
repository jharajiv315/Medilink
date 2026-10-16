import React, { useState } from 'react';
import type { AccessCategory } from '../types/medilink.ts';

interface ClinicAccessRequestProps {
  onNavigate: (path: string) => void;
}

export const ClinicAccessRequest: React.FC<ClinicAccessRequestProps> = ({ onNavigate }) => {
  const [patientCode, setPatientCode] = useState('DEMO-P001');
  const [purpose, setPurpose] = useState('Pre-operative Cardiology & Medication Clearance');
  const [durationDays, setDurationDays] = useState(30);
  const [selectedCategories, setSelectedCategories] = useState<AccessCategory[]>([
    'Allergies',
    'Medications',
    'Lab Reports',
    'Consultations'
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const allCategories: AccessCategory[] = [
    'Allergies',
    'Medications',
    'Lab Reports',
    'Consultations',
    'Cardiology',
    'Behavioral Health'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/clinic/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientCode,
          requesterName: 'Dr. Marcus Vance',
          requesterTitle: 'Attending Physician & Lead',
          requestingOrgId: 'org-sutter',
          requestingOrgName: 'Sutter Health Clinical Network',
          purpose,
          requestedCategories: selectedCategories,
          durationDays
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to submit access request.');
      } else {
        setRequestSuccess(data.grant);
      }
    } catch {
      setErrorMessage('Network error communicating with consent service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-12 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2F7EB] text-[#33650E] text-[11px] font-bold border border-[#DFE5D8] mb-2">
          <span className="material-symbols-outlined text-[14px]">lock_clock</span>
          <span>Inter-System Access Request</span>
        </div>
        <h1 className="font-['Plus_Jakarta_Sans'] text-[28px] sm:text-[34px] font-bold text-[#0B0808]">
          Request Patient Clinical Records
        </h1>
        <p className="font-['DM_Sans'] text-[15px] text-[#42493b] mt-1">
          Initiate a time-bound, category-scoped access request to a patient’s unified longitudinal
          history.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#DFE5D8] shadow-sm space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-[13px] font-bold text-[#0B0808] mb-1.5">
              Target Patient Code / MRN
            </label>
            <input
              type="text"
              value={patientCode}
              onChange={e => setPatientCode(e.target.value)}
              required
              placeholder="e.g. DEMO-P001 or ML-89204"
              className="w-full h-11 px-3.5 bg-[#FFFFFF] border border-[#DFE5D8] rounded-xl text-[14px] text-[#0B0808] focus:outline-none focus:border-[#33650E]"
            />
            <span className="text-[11px] text-[#667065] mt-1 block">
              Demo Patients: <strong>DEMO-P001</strong> (Ananya Sharma) or <strong>DEMO-P002</strong> (David Kim)
            </span>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#0B0808] mb-1.5">
              Requested Token Validity
            </label>
            <select
              value={durationDays}
              onChange={e => setDurationDays(Number(e.target.value))}
              className="w-full h-11 px-3.5 bg-[#FFFFFF] border border-[#DFE5D8] rounded-xl text-[14px] text-[#0B0808] focus:outline-none focus:border-[#33650E]"
            >
              <option value={7}>7 Days (Encounter / Urgent Care)</option>
              <option value={14}>14 Days (Specialty Consult)</option>
              <option value={30}>30 Days (Pre-op &amp; Longitudinal Review)</option>
              <option value={90}>90 Days (Chronic Disease Management)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-bold text-[#0B0808] mb-1.5">
            Clinical Purpose &amp; Medical Justification
          </label>
          <input
            type="text"
            value={purpose}
            onChange={e => setPurpose(e.target.value)}
            required
            className="w-full h-11 px-3.5 bg-[#FFFFFF] border border-[#DFE5D8] rounded-xl text-[14px] text-[#0B0808] focus:outline-none focus:border-[#33650E]"
          />
        </div>

        {/* Categories checklist */}
        <div>
          <label className="block text-[13px] font-bold text-[#0B0808] mb-2">
            Requested Clinical Categories (Granular Scopes):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {allCategories.map(cat => {
              const isChecked = selectedCategories.includes(cat);
              return (
                <label
                  key={cat}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-[13px] cursor-pointer transition-all ${
                    isChecked
                      ? 'border-[#33650E] bg-[#F2F7EB] font-bold text-[#0B0808]'
                      : 'border-[#DFE5D8] text-[#42493b] hover:bg-[#F4F5F1]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      if (isChecked) {
                        setSelectedCategories(selectedCategories.filter(c => c !== cat));
                      } else {
                        setSelectedCategories([...selectedCategories, cat]);
                      }
                    }}
                    className="rounded accent-[#33650E]"
                  />
                  <span>{cat}</span>
                </label>
              );
            })}
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-[#FFF0EF] border border-[#ffdad6] rounded-xl text-[13px] text-[#A33837]">
            {errorMessage}
          </div>
        )}

        <div className="pt-4 border-t border-[#DFE5D8] flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate('/clinic/dashboard')}
            className="text-[13px] font-medium text-[#484D45] hover:underline"
          >
            ← Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting || selectedCategories.length === 0}
            className="inline-flex items-center gap-2 bg-[#33650E] hover:bg-[#28510B] text-[#FFFFFF] text-[14px] font-semibold px-6 py-3 rounded-xl transition-all shadow-md active:scale-[0.98]"
          >
            {isSubmitting ? (
              <span>Submitting Request...</span>
            ) : (
              <>
                <span>Transmit Access Request</span>
                <span className="material-symbols-outlined text-[18px]">send</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success Notification */}
      {requestSuccess && (
        <div className="bg-[#FFFFFF] rounded-2xl p-6 border-2 border-[#78A541] shadow-lg space-y-4 animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#F2F7EB] text-[#33650E] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">mark_email_read</span>
            </div>
            <div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-[17px] font-bold text-[#0B0808]">
                Access Request Transmitted Successfully
              </h3>
              <p className="font-['DM_Sans'] text-[13px] text-[#42493b] mt-1">
                A pending cryptographic consent request has been dispatched to{' '}
                <strong>{requestSuccess.patientName}</strong> ({requestSuccess.patientId}).
              </p>
              <p className="text-[12px] text-[#667065] mt-1 font-mono">
                Grant Token: {requestSuccess.id} • Scopes: {requestSuccess.requestedCategories.join(', ')}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => onNavigate('/patient/consents')}
                  className="bg-[#33650E] text-[#FFFFFF] text-[13px] font-semibold px-4 py-2 rounded-xl hover:bg-[#28510B]"
                >
                  Switch to Patient Account to Approve
                </button>
                <button
                  onClick={() => onNavigate('/clinic/dashboard')}
                  className="bg-[#F2F7EB] text-[#33650E] border border-[#DFE5D8] text-[13px] font-semibold px-4 py-2 rounded-xl"
                >
                  Return to Clinic Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
