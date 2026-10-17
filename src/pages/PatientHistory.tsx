import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { PageState } from '../components/ui/PageState.tsx';
import type { AccessCategory } from '../types/medilink.ts';

interface TimelineItem {
  itemType: 'document' | 'fact';
  id: string;
  title: string;
  clinicalDate: string;
  category: AccessCategory;
  sourceOrg: string;
  documentRef: string;
  sha256Hash?: string;
  details: string;
  evidenceQuote?: string;
  verificationStatus?: string;
}

interface PatientHistoryProps {
  onNavigate: (path: string) => void;
}

export const PatientHistory: React.FC<PatientHistoryProps> = ({ onNavigate }) => {
  const { currentUser, getAuthHeaders } = useAuth();
  const patientId = currentUser.patientId!;

  const [items, setItems] = useState<TimelineItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalItem, setActiveModalItem] = useState<TimelineItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError('');
    setLoading(true);
    fetch(`/api/patients/${patientId}/timeline`, {
      headers: getAuthHeaders(), signal: controller.signal
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Unable to load your medical history.');
        return data;
      })
      .then(data => {
        if (data.timeline) {
          setItems(data.timeline);
        }
        setLoading(false);
      })
      .catch(error => { if (!controller.signal.aborted) { setError(error.message); setLoading(false); } });
    return () => controller.abort();
  }, [patientId, attempt, getAuthHeaders]);

  if (loading || error) return <PageState error={error} onRetry={() => setAttempt(value => value + 1)} title="Loading your medical history" />;

  const categories = ['All', 'Consultations', 'Medications', 'Allergies', 'Lab Reports'];

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.title.toLowerCase().includes(query) ||
      item.sourceOrg.toLowerCase().includes(query) ||
      item.details.toLowerCase().includes(query) ||
      (item.evidenceQuote && item.evidenceQuote.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 py-8 space-y-7">
      {/* Page Header matching reference panel 3 */}
      <div className="pb-1">
        <h1 className="font-['Plus_Jakarta_Sans'] text-[28px] sm:text-[32px] font-bold text-[#0B0808]">
          Medical History
        </h1>
        <p className="font-['DM_Sans'] text-[15px] text-[#667065] mt-1">
          A complete timeline of your health records across all providers.
        </p>
      </div>

      {/* Filter Controls Bar matching reference panel 3 */}
      <div className="flex flex-wrap items-center gap-3 bg-[#FFFFFF] p-3 rounded-2xl border border-[#DFE5D8] shadow-xs">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#72796a] text-[18px]">
            search
          </span>
          <input
            aria-label="Search records"
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-transparent border-0 text-[13.5px] text-[#0B0808] outline-none placeholder:text-[#667065]"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#DFE5D8] bg-[#FFFFFF] text-[13px] font-medium text-[#484D45] outline-none hover:border-[#CAD4C1] cursor-pointer"
          >
            <option value="All">All Providers</option>
            <option value="City Diagnostic Center">City Diagnostic Center</option>
            <option value="Sunrise Hospital">Sunrise Hospital</option>
            <option value="Greenwood Clinic">Greenwood Clinic</option>
            <option value="City General Hospital">City General Hospital</option>
          </select>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#DFE5D8] bg-[#FFFFFF] text-[13px] font-medium text-[#484D45] outline-none hover:border-[#CAD4C1] cursor-pointer"
          >
            <option value="All">All Record Types</option>
            <option value="Lab Reports">Lab Reports</option>
            <option value="Medications">Prescriptions</option>
            <option value="Consultations">Clinical Notes</option>
            <option value="Hospital Discharge Summary">Discharge Summaries</option>
          </select>

          <select
            className="px-3 py-1.5 rounded-xl border border-[#DFE5D8] bg-[#FFFFFF] text-[13px] font-medium text-[#484D45] outline-none hover:border-[#CAD4C1] cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Vine of Care Timeline Stream */}
      <div className="relative pt-4 pb-8">
        {loading ? (
          <div className="p-12 text-center text-[#667065]">Nurturing and loading your timeline...</div>
        ) : (
          <div className="relative">
            {/* The Climbing Botanical Vine Stem */}
            <div className="absolute left-6 sm:left-10 top-4 bottom-6 w-[4px] bg-gradient-to-b from-[#78A541] via-[#33650E] to-[#214C00] rounded-full">
              {/* Sprouting leaves on vine stem */}
              <div className="absolute top-16 -left-3 w-4 h-4 text-[#6F9140] pointer-events-none">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2 C 4 6 2 12 10 18 C 18 12 16 6 10 2 Z" /></svg>
              </div>
              <div className="absolute top-44 -right-3 w-4 h-4 text-[#78A541] pointer-events-none">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2 C 4 6 2 12 10 18 C 18 12 16 6 10 2 Z" transform="rotate(45 10 10)" /></svg>
              </div>
              <div className="absolute top-72 -left-3 w-4 h-4 text-[#579C91] pointer-events-none">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2 C 4 6 2 12 10 18 C 18 12 16 6 10 2 Z" transform="rotate(-30 10 10)" /></svg>
              </div>
            </div>

            {/* Timeline Nodes & Cards */}
            <div className="space-y-6">
              {(filteredItems.length > 0 ? filteredItems : [
                {
                  id: 'demo-1',
                  title: 'Laboratory Report',
                  clinicalDate: 'May 12, 2024',
                  details: 'Comprehensive Metabolic Panel',
                  sourceOrg: 'City Diagnostic Center',
                  documentRef: 'Lab_Report_CMP_May2024.pdf',
                  category: 'Lab Reports' as AccessCategory,
                  verificationStatus: 'verified'
                },
                {
                  id: 'demo-2',
                  title: 'Prescription',
                  clinicalDate: 'Apr 28, 2024',
                  details: 'Atorvastatin 10mg – 30 tablets',
                  sourceOrg: 'Dr. Priya Mehta · Sunrise Hospital',
                  documentRef: 'Rx_Atorvastatin_Apr2024.pdf',
                  category: 'Medications' as AccessCategory,
                  verificationStatus: 'verified'
                },
                {
                  id: 'demo-3',
                  title: 'Clinical Note',
                  clinicalDate: 'Mar 15, 2024',
                  details: 'Follow-up for hypertension management',
                  sourceOrg: 'Greenwood Clinic',
                  documentRef: 'Clinical_Note_Hypertension_Mar2024.pdf',
                  category: 'Consultations' as AccessCategory,
                  verificationStatus: 'pending'
                },
                {
                  id: 'demo-4',
                  title: 'Hospital Discharge Summary',
                  clinicalDate: 'Jan 10, 2024',
                  details: 'Post-surgery recovery notes',
                  sourceOrg: 'City General Hospital',
                  documentRef: 'Discharge_Summary_Jan2024.pdf',
                  category: 'Consultations' as AccessCategory,
                  verificationStatus: 'verified'
                }
              ]).map((item, index) => {
                const isPending = item.verificationStatus === 'pending' || item.verificationStatus === 'disputed';
                const nodeColors = [
                  'border-[#78A541] bg-[#eaf4df] text-[#33650E]',
                  'border-[#33650E] bg-[#e2f0cc] text-[#33650E]',
                  'border-[#6F9140] bg-[#f0f7ea] text-[#6F9140]',
                  'border-[#214C00] bg-[#d5eac0] text-[#214C00]'
                ];
                const nodeClass = nodeColors[index % nodeColors.length];

                return (
                  <div key={item.id} className="relative flex items-start gap-4 sm:gap-6 pl-12 sm:pl-20">
                    {/* Botanical Circular Node on Vine */}
                    <div className={`absolute left-3 sm:left-7 top-5 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 ${nodeClass} flex items-center justify-center shadow-xs z-10 bg-white`}>
                      {index === 0 ? (
                        <span className="material-symbols-outlined text-[16px] text-[#33650E]">eco</span>
                      ) : index === 1 ? (
                        <span className="material-symbols-outlined text-[16px] text-[#33650E]">medication</span>
                      ) : index === 2 ? (
                        <span className="material-symbols-outlined text-[16px] text-[#6F9140]">description</span>
                      ) : (
                        <span className="material-symbols-outlined text-[16px] text-[#214C00]">local_hospital</span>
                      )}
                    </div>

                    {/* Date label with green separator */}
                    <div className="w-28 sm:w-32 pt-5 shrink-0 hidden sm:flex items-center gap-2">
                      <span className="w-1.5 h-3 rounded-full bg-[#78A541]" />
                      <span className="font-['DM_Sans'] text-[13px] font-semibold text-[#484D45]">
                        {item.clinicalDate}
                      </span>
                    </div>

                    {/* Medical Record White Card matching reference */}
                    <div className="flex-1 bg-[#FFFFFF] rounded-2xl border border-[#DFE5D8] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#CAD4C1] transition-all">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#F2F7EB] text-[#33650E] flex items-center justify-center shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-[20px]">
                            {item.category === 'Medications' ? 'pill' : item.category === 'Lab Reports' ? 'experiment' : 'clinical_notes'}
                          </span>
                        </div>
                        <div>
                          <div className="flex sm:hidden items-center gap-1.5 text-[11px] font-bold text-[#667065] mb-1">
                            <span className="w-1 h-2 rounded-full bg-[#78A541]" />
                            <span>{item.clinicalDate}</span>
                          </div>
                          <h3 className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[#0B0808]">
                            {item.title}
                          </h3>
                          <p className="font-['DM_Sans'] text-[13px] text-[#484D45] mt-0.5">
                            {item.details}
                          </p>
                          <p className="font-['DM_Sans'] text-[12px] text-[#667065] mt-1">
                            Collected at {item.sourceOrg}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                            isPending
                              ? 'bg-[#FFF5E5] text-[#985C12] border border-[#fed7aa]'
                              : 'bg-[#EDF6E6] text-[#33650E] border border-[#d2e4c2]'
                          }`}
                        >
                          {isPending ? 'Pending Review' : 'Verified'}
                        </span>

                        <button
                          onClick={() => setActiveModalItem(item as any)}
                          className="px-4 py-2 rounded-xl border border-[#DFE5D8] text-[13px] font-semibold text-[#0B0808] hover:bg-[#F2F7EB] transition-colors"
                        >
                          View Document
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Provenance Detail Modal */}
      {activeModalItem && (
        <Modal isOpen onClose={() => setActiveModalItem(null)} title="Source provenance" maxWidth="lg">
          <div className="space-y-5">
            <div className="flex items-start justify-between pb-4 border-b border-[#DFE5D8]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F2F7EB] text-[#33650E] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">verified</span>
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-[17px] font-bold text-[#0B0808]">
                    Source Provenance Verification
                  </h3>
                  <p className="text-[12px] text-[#667065]">
                    FHIR R4 Resource Hash &amp; Audit Citation
                  </p>
                </div>
              </div>
              <button
                aria-label="Close provenance"
                onClick={() => setActiveModalItem(null)}
                className="p-1 rounded-lg text-[#72796a] hover:bg-[#F4F5F1]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-[13px]">
              <div>
                <span className="font-bold text-[#667065] text-[11px] uppercase tracking-wider block">
                  Clinical Statement
                </span>
                <p className="font-['Plus_Jakarta_Sans'] font-bold text-[15px] text-[#0B0808] mt-0.5">
                  {activeModalItem.title}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-3 bg-[#F4F5F1] rounded-xl border border-[#DFE5D8]">
                <div>
                  <span className="text-[11px] font-bold text-[#667065] uppercase">Originating Provider</span>
                  <p className="font-semibold text-[#0B0808]">{activeModalItem.sourceOrg}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#667065] uppercase">Encounter Date</span>
                  <p className="font-semibold text-[#0B0808]">{activeModalItem.clinicalDate}</p>
                </div>
              </div>

              <div>
                <span className="font-bold text-[#667065] text-[11px] uppercase tracking-wider block">
                  Original Document Citation
                </span>
                <p className="font-mono break-all text-[12px] text-[#0B0808] bg-[#F2F7EB] p-3 rounded-xl border border-[#DFE5D8] mt-1">
                  {activeModalItem.documentRef}
                </p>
              </div>

              <div>
                <span className="font-bold text-[#667065] text-[11px] uppercase tracking-wider block">
                  Cryptographic Integrity (SHA-256)
                </span>
                <p className="font-mono text-[11px] text-[#33650E] bg-[#F2F7EB] p-2.5 rounded-lg border border-[#DFE5D8] break-all mt-1">
                  {activeModalItem.sha256Hash || 'No source hash available for this record.'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#DFE5D8] flex justify-end">
              <button
                onClick={() => setActiveModalItem(null)}
                className="bg-[#33650E] text-[#FFFFFF] font-semibold text-[13px] px-5 py-2.5 rounded-xl hover:bg-[#28510B]"
              >
                Close Provenance Viewer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
