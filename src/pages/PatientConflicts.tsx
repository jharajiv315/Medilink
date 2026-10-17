import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import type { DiscrepancyConflict } from '../types/medilink.ts';
import { BotanicalBackground } from '../components/botanical/BotanicalBackground.tsx';

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

  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Allergies' | 'Medications' | 'Conditions'>('All');
  const [showNoteInput, setShowNoteInput] = useState(false);

  return (
    <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-8 space-y-7">
      {/* Background botanical corner accent */}
      <BotanicalBackground position="bottom-left" />

      {error && <div role="alert" className="rounded-2xl border border-[#A33837]/20 bg-[#FFF0EF] p-4 text-sm text-[#A33837]">{error} <button onClick={loadConflicts} className="ml-2 font-bold underline">Reload</button></div>}
      
      {/* Page Header matching reference panel 4 */}
      <div className="pb-1">
        <h1 className="font-['Plus_Jakarta_Sans'] text-[28px] sm:text-[32px] font-bold text-[#0B0808]">
          Record Discrepancies
        </h1>
        <p className="font-['DM_Sans'] text-[15px] text-[#667065] mt-1">
          We've found information that may need clinical review.
        </p>
      </div>

      {/* Filter Tabs matching reference panel 4 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedFilter('All')}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
              selectedFilter === 'All'
                ? 'bg-[#285208] text-[#FFFFFF] font-semibold shadow-xs'
                : 'bg-[#FFFFFF] text-[#484D45] border border-[#DFE5D8] hover:bg-[#F2F7EB]'
            }`}
          >
            All (3)
          </button>
          <button
            onClick={() => setSelectedFilter('Allergies')}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
              selectedFilter === 'Allergies'
                ? 'bg-[#285208] text-[#FFFFFF] font-semibold shadow-xs'
                : 'bg-[#FFFFFF] text-[#484D45] border border-[#DFE5D8] hover:bg-[#F2F7EB]'
            }`}
          >
            Allergies (1)
          </button>
          <button
            onClick={() => setSelectedFilter('Medications')}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
              selectedFilter === 'Medications'
                ? 'bg-[#285208] text-[#FFFFFF] font-semibold shadow-xs'
                : 'bg-[#FFFFFF] text-[#484D45] border border-[#DFE5D8] hover:bg-[#F2F7EB]'
            }`}
          >
            Medications (1)
          </button>
          <button
            onClick={() => setSelectedFilter('Conditions')}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
              selectedFilter === 'Conditions'
                ? 'bg-[#285208] text-[#FFFFFF] font-semibold shadow-xs'
                : 'bg-[#FFFFFF] text-[#484D45] border border-[#DFE5D8] hover:bg-[#F2F7EB]'
            }`}
          >
            Conditions (1)
          </button>
        </div>

        <button
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#DFE5D8] bg-[#FFFFFF] text-[13px] font-medium text-[#484D45] hover:bg-[#F2F7EB] shadow-2xs"
        >
          <span className="material-symbols-outlined text-[16px]">filter_list</span>
          <span>Filter</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-[#667065]">Analyzing clinical records for conflicts...</div>
      ) : (
        /* Two-column layout matching reference panel 4 */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Discrepancy Card */}
          <div className="lg:col-span-8 bg-[#FFFFFF] rounded-2xl border border-[#DFE5D8] p-6 sm:p-7 shadow-xs space-y-5">
            {/* Alert Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#F0F4EA]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FFF5E5] text-[#985C12] flex items-center justify-center font-bold shrink-0">
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                </div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-[17px] font-bold text-[#0B0808]">
                  Conflicting Allergy Information
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-[11.5px] font-semibold bg-[#FFF0EF] text-[#A33837] border border-[#fed7d7]">
                Needs Review
              </span>
            </div>

            {/* Side-by-side comparison boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Box A */}
              <div className="p-4 rounded-xl bg-[#FFFDF9] border border-[#F2D4A8] flex flex-col justify-between space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#FFF0EF] text-[#A33837] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[15px]">domain</span>
                  </div>
                  <div>
                    <h4 className="font-['Plus_Jakarta_Sans'] text-[13px] font-bold text-[#0B0808]">Hospital A</h4>
                    <span className="text-[11px] text-[#667065]">Jan 12, 2024</span>
                  </div>
                </div>
                <p className="font-['DM_Sans'] text-[13.5px] font-medium text-[#0B0808] italic bg-[#FFFFFF] p-3 rounded-lg border border-[#F0DFCA]">
                  "Penicillin allergy — rash."
                </p>
                <button
                  onClick={() => onNavigate('/patient/history')}
                  className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#484D45] hover:text-[#0B0808]"
                >
                  <span className="material-symbols-outlined text-[14px]">description</span>
                  <span>View Original Document</span>
                </button>
              </div>

              {/* Box B */}
              <div className="p-4 rounded-xl bg-[#F8FAF5] border border-[#D2E4C2] flex flex-col justify-between space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#EDF6E6] text-[#33650E] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[15px]">medical_services</span>
                  </div>
                  <div>
                    <h4 className="font-['Plus_Jakarta_Sans'] text-[13px] font-bold text-[#0B0808]">Clinic B</h4>
                    <span className="text-[11px] text-[#667065]">Jun 18, 2024</span>
                  </div>
                </div>
                <p className="font-['DM_Sans'] text-[13.5px] font-medium text-[#0B0808] italic bg-[#FFFFFF] p-3 rounded-lg border border-[#DFE8D7]">
                  "No known drug allergies."
                </p>
                <button
                  onClick={() => onNavigate('/patient/history')}
                  className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#484D45] hover:text-[#0B0808]"
                >
                  <span className="material-symbols-outlined text-[14px]">description</span>
                  <span>View Original Document</span>
                </button>
              </div>
            </div>

            {/* Why this was flagged callout */}
            <div className="p-4 rounded-xl bg-[#FFFBF2] border border-[#F5E5C9] space-y-1">
              <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#985C12]">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span>Why this was flagged?</span>
              </div>
              <p className="font-['DM_Sans'] text-[13px] text-[#667065] leading-relaxed">
                One record documents a penicillin allergy with a rash, while a later record states no known drug allergies.
                This could be a documentation discrepancy and should be reviewed by your clinician.
              </p>
            </div>

            {/* Note input toggle for user feedback */}
            {showNoteInput && (
              <div className="p-4 rounded-xl bg-[#F2F7EB] border border-[#DFE5D8] space-y-3 animate-in fade-in">
                <h4 className="text-[13px] font-bold text-[#0B0808]">Add note for your clinician:</h4>
                <textarea
                  rows={2}
                  value={patientNotes['penicillin'] || ''}
                  onChange={e => setPatientNotes({ ...patientNotes, penicillin: e.target.value })}
                  placeholder="e.g. I did have a mild rash as a child when taking penicillin, but no severe reaction."
                  className="w-full p-2.5 rounded-lg border border-[#DFE5D8] bg-white text-[13px] text-[#0B0808] outline-none"
                />
                <button
                  onClick={() => handleAffirm('penicillin')}
                  disabled={isAffirming}
                  className="bg-[#33650E] text-white text-[12px] font-bold px-4 py-2 rounded-lg hover:bg-[#28510B]"
                >
                  {isAffirming ? 'Saving note…' : 'Save Note for Clinician'}
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Details Panel matching reference */}
          <div className="lg:col-span-4 bg-[#FFFFFF] rounded-2xl border border-[#DFE5D8] p-6 shadow-xs space-y-5">
            <h3 className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[#0B0808] pb-3 border-b border-[#F0F4EA]">
              Details
            </h3>

            <div className="space-y-3 text-[13px] font-['DM_Sans']">
              <div className="flex items-center justify-between">
                <span className="text-[#667065]">Category</span>
                <span className="font-semibold text-[#0B0808]">Allergy</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#667065]">Sources</span>
                <span className="font-semibold text-[#0B0808]">2 records</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#667065]">First recorded</span>
                <span className="font-semibold text-[#0B0808]">Jan 12, 2024</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#667065]">Last recorded</span>
                <span className="font-semibold text-[#0B0808]">Jun 18, 2024</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[#667065]">Status</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#985C12]">
                  <span className="w-2 h-2 rounded-full bg-[#985C12]" />
                  <span>Needs clinical review</span>
                </span>
              </div>
            </div>

            <div className="pt-3 space-y-2.5">
              <button
                onClick={() => handleAffirm('penicillin')}
                className="w-full flex items-center justify-center gap-2 bg-[#285208] hover:bg-[#1e4604] text-[#FFFFFF] font-['DM_Sans'] text-[13.5px] font-semibold py-2.5 px-4 rounded-xl transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                <span>Mark as Reviewed</span>
              </button>

              <button
                onClick={() => setShowNoteInput(prev => !prev)}
                className="w-full flex items-center justify-center gap-1.5 bg-[#FFFFFF] hover:bg-[#F2F7EB] text-[#0B0808] border border-[#DFE5D8] font-['DM_Sans'] text-[13.5px] font-medium py-2.5 px-4 rounded-xl transition-colors"
              >
                <span>Add a Note</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

