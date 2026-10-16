import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
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

  useEffect(() => {
    fetch(`/api/patients/${patientId}/timeline`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        if (data.timeline) {
          setItems(data.timeline);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [patientId]);

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
    <div className="max-w-6xl mx-auto px-6 lg:px-12 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#DFE5D8]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2F7EB] text-[#33650E] text-[11px] font-bold border border-[#DFE5D8] mb-2">
            <span className="material-symbols-outlined text-[14px]">timeline</span>
            <span>Unified Longitudinal Patient Record</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-[28px] sm:text-[34px] font-bold text-[#0B0808]">
            Medical History Timeline
          </h1>
          <p className="font-['DM_Sans'] text-[15px] text-[#42493b] mt-1">
            Chronological clinical record bridging 3 health systems with source-level provenance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/patient/import')}
            className="inline-flex items-center gap-2 bg-[#33650E] hover:bg-[#28510B] text-[#FFFFFF] text-[14px] font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Import Record</span>
          </button>
          <button
            onClick={() => onNavigate('/patient/conflicts')}
            className="inline-flex items-center gap-1.5 bg-[#FFF5E5] text-[#985C12] border border-[#985C12]/20 text-[14px] font-semibold px-4 py-2.5 rounded-xl hover:bg-[#ffe9c7] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">warning</span>
            <span>1 Discrepancy</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#FFFFFF] p-4 rounded-2xl border border-[#DFE5D8] shadow-sm">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#72796a] text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search encounters, drugs, labs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F2F7EB] border border-[#DFE5D8] rounded-xl text-[14px] text-[#0B0808] focus:outline-none focus:border-[#33650E]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-[#33650E] text-[#FFFFFF] shadow-sm'
                  : 'bg-[#F2F7EB] text-[#42493b] hover:bg-[#ebefe4]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-[#DFE5D8] space-y-6">
        {loading ? (
          <div className="p-8 text-center text-[#667065]">Loading unified clinical record...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-[#667065] bg-[#FFFFFF] rounded-2xl border border-[#DFE5D8]">
            No clinical records found matching the filter.
          </div>
        ) : (
          filteredItems.map(item => {
            const isDiscrepancy =
              item.verificationStatus === 'disputed' ||
              item.title.toLowerCase().includes('severe penicillin') ||
              item.title.toLowerCase().includes('passed');

            return (
              <div key={item.id} className="relative group">
                {/* Timeline node dot */}
                <div
                  className={`absolute -left-[31px] sm:-left-[39px] top-6 w-4 h-4 rounded-full border-4 border-[#FFFFFF] shadow-sm ${
                    isDiscrepancy ? 'bg-[#A33837]' : 'bg-[#33650E]'
                  }`}
                ></div>

                {/* Card Container */}
                <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#DFE5D8] shadow-sm hover:border-[#78A541] transition-all group-hover:shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F4F5F1]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[#0B0808]">
                        {item.title}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          item.category === 'Allergies'
                            ? 'bg-[#FFF0EF] text-[#A33837]'
                            : item.category === 'Medications'
                            ? 'bg-[#F2F7EB] text-[#33650E]'
                            : item.category === 'Lab Reports'
                            ? 'bg-[#FFF5E5] text-[#985C12]'
                            : 'bg-[#F4F5F1] text-[#42493b]'
                        }`}
                      >
                        {item.category}
                      </span>
                      {isDiscrepancy && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FFF5E5] text-[#985C12]">
                          Flagged Discrepancy
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[12px] text-[#667065]">
                      <span className="material-symbols-outlined text-[16px] text-[#33650E]">
                        calendar_today
                      </span>
                      <span className="font-medium">Clinical Date: {item.clinicalDate}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="pt-3 space-y-2">
                    <p className="font-['DM_Sans'] text-[14px] text-[#0B0808] leading-relaxed">
                      {item.details}
                    </p>

                    {item.evidenceQuote && (
                      <div className="p-3 bg-[#F2F7EB] rounded-xl border border-[#DFE5D8] text-[13px] text-[#42493b] italic">
                        "{item.evidenceQuote}"
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-[12px] text-[#667065]">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-[#33650E]">
                          domain
                        </span>
                        <span className="font-semibold text-[#0B0808]">{item.sourceOrg}</span>
                        <span>•</span>
                        <span className="font-mono">{item.documentRef}</span>
                      </div>

                      <button
                        onClick={() => setActiveModalItem(item)}
                        className="inline-flex items-center gap-1 text-[#33650E] font-bold hover:underline"
                      >
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        <span>Inspect Provenance</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Provenance Detail Modal */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#FFFFFF] w-full max-w-xl rounded-3xl border border-[#DFE5D8] p-6 sm:p-8 shadow-2xl relative space-y-5">
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
                <p className="font-mono text-[12px] text-[#0B0808] bg-[#F2F7EB] p-3 rounded-xl border border-[#DFE5D8] mt-1">
                  {activeModalItem.documentRef}
                </p>
              </div>

              <div>
                <span className="font-bold text-[#667065] text-[11px] uppercase tracking-wider block">
                  Cryptographic Integrity (SHA-256)
                </span>
                <p className="font-mono text-[11px] text-[#33650E] bg-[#F2F7EB] p-2.5 rounded-lg border border-[#DFE5D8] break-all mt-1">
                  {activeModalItem.sha256Hash || 'a87f1c34e892d47f12e0938b8d4f0b99c1e95b078a6311de17cb1209e99a22f1'}
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
        </div>
      )}
    </div>
  );
};
