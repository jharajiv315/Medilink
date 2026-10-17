import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import type { AccessCategory } from '../types/medilink.ts';
import { Clock3, ShieldCheck, Send, MailCheck } from 'lucide-react';

interface ClinicAccessRequestProps {
  onNavigate: (path: string) => void;
}

export const ClinicAccessRequest: React.FC<ClinicAccessRequestProps> = ({ onNavigate }) => {
  const { currentUser, getAuthHeaders } = useAuth();
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
        headers: getAuthHeaders(),
        body: JSON.stringify({
          patientCode,
          requesterName: currentUser.name || 'Dr. Marcus Vance',
          requesterTitle: currentUser.title || 'Attending Physician & Lead',
          requestingOrgId: currentUser.organizationId || 'org-sutter',
          requestingOrgName: currentUser.organization || 'Sutter Health Clinical Network',
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DFE5D8] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2F7EB] text-[#33650E] text-[11px] font-bold border border-[#DFE5D8] mb-2">
            <Clock3 className="w-3.5 h-3.5 shrink-0" />
            <span>Clinician workspace · Consent request</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-[28px] sm:text-[32px] font-bold text-[#0B0808]">
            Request patient records
          </h1>
          <p className="font-['DM_Sans'] text-[15px] text-[#42493b] mt-1 max-w-2xl">
            Select the records needed for this review. The patient decides whether to approve access.
          </p>
        </div>
        <button type="button" onClick={() => onNavigate('/clinic/dashboard')} className="text-[13px] font-bold text-[#33650E] hover:underline whitespace-nowrap self-start sm:self-auto">Back to overview</button>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-[#DCE4D5] bg-[#F2F7EB] px-5 py-4 text-[13px] text-[#42493b]">
        <ShieldCheck className="w-5 h-5 text-[#33650E] shrink-0" />
        <p><strong className="text-[#0B0808]">Patient controlled:</strong> Only approved categories appear in the clinical handoff, and access ends when the grant expires or is revoked.</p>
      </div>

      {!requestSuccess && <form
        onSubmit={handleSubmit}
        className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#DFE5D8] shadow-sm space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-[13px] font-bold text-[#0B0808] mb-1.5">
              Patient ID or medical record number
            </label>
            <input
              type="text"
              aria-label="Patient code"
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
              Access duration
            </label>
            <select
              aria-label="Requested access duration"
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
            Reason for access
          </label>
          <input
            type="text"
            aria-label="Reason for access"
            maxLength={2000}
            value={purpose}
            onChange={e => setPurpose(e.target.value)}
            required
            className="w-full h-11 px-3.5 bg-[#FFFFFF] border border-[#DFE5D8] rounded-xl text-[14px] text-[#0B0808] focus:outline-none focus:border-[#33650E]"
          />
        </div>

        {/* Categories checklist */}
        <div>
          <label className="block text-[13px] font-bold text-[#0B0808] mb-2">
            Records requested
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
          <div role="alert" className="p-3 bg-[#FFF0EF] border border-[#ffdad6] rounded-xl text-[13px] text-[#A33837]">
            {errorMessage}
          </div>
        )}

        <div className="pt-4 border-t border-[#DFE5D8] flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4">
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
            className="inline-flex items-center justify-center gap-2 bg-[#33650E] hover:bg-[#28510B] disabled:opacity-50 disabled:cursor-not-allowed text-[#FFFFFF] text-[14px] font-semibold px-6 py-3 rounded-xl transition-all shadow-sm active:scale-[0.98]"
          >
            {isSubmitting ? (
              <span>Submitting Request...</span>
            ) : (
              <>
                <span>Send request</span>
                <Send className="w-[18px] h-[18px]" />
              </>
            )}
          </button>
        </div>
      </form>}

      {/* Success Notification */}
      {requestSuccess && (
        <div role="status" className="bg-[#FFFFFF] rounded-2xl p-6 border-2 border-[#78A541] shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#F2F7EB] text-[#33650E] flex items-center justify-center shrink-0">
              <MailCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-[17px] font-bold text-[#0B0808]">
                Request sent
              </h3>
              <p className="font-['DM_Sans'] text-[13px] text-[#42493b] mt-1">
                The request is waiting for approval from{' '}
                <strong>{requestSuccess.patientName}</strong> ({requestSuccess.patientId}).
              </p>
              <p className="text-[12px] text-[#667065] mt-1 font-mono">
                Request ID: {requestSuccess.id} · Records: {requestSuccess.requestedCategories.join(', ')}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => setRequestSuccess(null)}
                  className="bg-[#33650E] text-[#FFFFFF] text-[13px] font-semibold px-4 py-2 rounded-xl hover:bg-[#28510B]"
                >
                  Create another request
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
