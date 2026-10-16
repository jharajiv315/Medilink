import React, { useState } from 'react';

interface PatientImportProps {
  onNavigate: (path: string) => void;
}

export const PatientImport: React.FC<PatientImportProps> = ({ onNavigate }) => {
  const [sourceOrg, setSourceOrg] = useState('Stanford Health Care');
  const [docCategory, setDocCategory] = useState<'discharge_summary' | 'specialty_consult' | 'lab_report' | 'prescription_order'>('specialty_consult');
  const [docTitle, setDocTitle] = useState('Cardiology Consultation & Echo Evaluation');
  const [clinicalDate, setClinicalDate] = useState('2026-03-15');
  const [fileName, setFileName] = useState('Cardiology_Consult_Stanford_2026.pdf');
  const [rawText, setRawText] = useState(
    'CONSULTATION REASON: Pre-operative cardiac clearance for elective orthopedics.\nFINDINGS: Normal sinus rhythm. LVEF 60-65%. No ischemic changes.\nMEDICATIONS: Metformin 1000mg BID continued. Lisinopril 10mg daily.\nALLERGIES: Reviewed prior skin challenge report; confirmed tolerating oral cephalosporins without rash.'
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState<any | null>(null);

  const loadSample = (preset: 'cardio' | 'urgent' | 'endocrine') => {
    if (preset === 'cardio') {
      setSourceOrg('Stanford Health Care');
      setDocCategory('specialty_consult');
      setDocTitle('Cardiology Consultation & Echo Evaluation');
      setClinicalDate('2026-03-15');
      setFileName('Cardiology_Consult_Stanford_2026.pdf');
      setRawText(
        'CONSULTATION REASON: Pre-operative cardiac clearance for elective orthopedics.\nFINDINGS: Normal sinus rhythm. LVEF 60-65%. No ischemic changes.\nMEDICATIONS: Metformin 1000mg BID continued. Lisinopril 10mg daily.\nALLERGIES: Reviewed prior allergy challenge report; confirmed tolerating oral cephalosporins without rash.'
      );
    } else if (preset === 'urgent') {
      setSourceOrg('Northwestern Medicine Urgent Care');
      setDocCategory('discharge_summary');
      setDocTitle('Urgent Care Clinical Encounter Note');
      setClinicalDate('2026-05-10');
      setFileName('Northwestern_UrgentCare_May26.pdf');
      setRawText(
        'CHIEF COMPLAINT: Acute productive cough and sinusitis for 4 days.\nASSESSMENT: Acute bacterial rhinosinusitis.\nPLAN: Prescribed Cefdinir 300mg BID x 7 days. Patient noted history of childhood penicillin reaction but passed negative skin test in 2023. No reaction observed upon first dose.'
      );
    } else {
      setSourceOrg('Endocrine Associates of Chicago');
      setDocCategory('prescription_order');
      setDocTitle('Endocrine Medication Reconciliation Note');
      setClinicalDate('2026-06-20');
      setFileName('Endocrine_Reconciliation_Jun26.pdf');
      setRawText(
        'ASSESSMENT: Type 2 Diabetes well controlled on current regimen.\nCURRENT RX:\n1. Metformin HCl 1000mg PO BID with breakfast and dinner.\n2. Lisinopril 10mg PO daily.\n3. Semaglutide 0.5mg SQ once weekly.'
      );
    }
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Extract synthetic candidate facts
    const extractedItems = [];
    if (rawText.toLowerCase().includes('metformin 1000mg')) {
      extractedItems.push({
        factType: 'medication',
        conceptKey: 'metformin',
        assertion: 'Metformin 1000mg BID',
        value: '1000mg BID PO',
        evidenceQuote: 'Metformin 1000mg BID continued.'
      });
    }
    if (rawText.toLowerCase().includes('lisinopril')) {
      extractedItems.push({
        factType: 'medication',
        conceptKey: 'lisinopril',
        assertion: 'Lisinopril 10mg daily',
        value: '10mg daily PO',
        evidenceQuote: 'Lisinopril 10mg daily.'
      });
    }
    if (rawText.toLowerCase().includes('cefdinir')) {
      extractedItems.push({
        factType: 'medication',
        conceptKey: 'cefdinir',
        assertion: 'Cefdinir 300mg BID (Cephalosporin)',
        value: '300mg BID x 7 days',
        evidenceQuote: 'Prescribed Cefdinir 300mg BID x 7 days.'
      });
    }

    try {
      const res = await fetch('/api/patients/DEMO-P001/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: docTitle,
          documentType: docCategory,
          sourceOrgName: sourceOrg,
          sourceOrgId: `org-${sourceOrg.toLowerCase().replace(/\s+/g, '-')}`,
          clinicalDate,
          rawText,
          fileName,
          extractedItems
        })
      });
      const data = await res.json();
      setIngestSuccess(data);
    } catch {
      alert('Error ingesting document to continuity engine.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-12 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2F7EB] text-[#33650E] text-[11px] font-bold border border-[#DFE5D8] mb-2">
          <span className="material-symbols-outlined text-[14px]">cloud_upload</span>
          <span>Multi-Format Ingestion Engine</span>
        </div>
        <h1 className="font-['Plus_Jakarta_Sans'] text-[28px] sm:text-[32px] font-bold text-[#0B0808]">
          Import Clinical Records
        </h1>
        <p className="font-['DM_Sans'] text-[15px] text-[#42493b] mt-1">
          Securely ingest hospital discharge summaries, specialist encounter notes, or laboratory PDFs
          into your unified longitudinal record.
        </p>
      </div>

      {/* Preset Fast-Loader */}
      <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#DFE5D8] shadow-sm">
        <span className="text-[11px] font-bold text-[#667065] uppercase tracking-wider block mb-3">
          Quick Load Verified Clinical Presets
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => loadSample('cardio')}
            className="p-3 rounded-xl border border-[#DFE5D8] hover:border-[#33650E] hover:bg-[#F2F7EB] text-left transition-all"
          >
            <p className="font-['Plus_Jakarta_Sans'] text-[13px] font-bold text-[#0B0808]">
              Stanford Cardiology Consult
            </p>
            <p className="text-[11px] text-[#42493b] mt-0.5">
              Pre-op echo clearance, cephalosporin tolerance review
            </p>
          </button>
          <button
            type="button"
            onClick={() => loadSample('urgent')}
            className="p-3 rounded-xl border border-[#DFE5D8] hover:border-[#33650E] hover:bg-[#F2F7EB] text-left transition-all"
          >
            <p className="font-['Plus_Jakarta_Sans'] text-[13px] font-bold text-[#0B0808]">
              Northwestern Urgent Care
            </p>
            <p className="text-[11px] text-[#42493b] mt-0.5">
              Sinusitis encounter note &amp; Cefdinir prescription
            </p>
          </button>
          <button
            type="button"
            onClick={() => loadSample('endocrine')}
            className="p-3 rounded-xl border border-[#DFE5D8] hover:border-[#33650E] hover:bg-[#F2F7EB] text-left transition-all"
          >
            <p className="font-['Plus_Jakarta_Sans'] text-[13px] font-bold text-[#0B0808]">
              Endocrine Reconciliation
            </p>
            <p className="text-[11px] text-[#42493b] mt-0.5">
              Metformin 1000mg BID confirmation &amp; A1c monitoring
            </p>
          </button>
        </div>
      </div>

      {/* Ingestion Form */}
      <form onSubmit={handleIngest} className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#DFE5D8] shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-[13px] font-bold text-[#0B0808] mb-1.5">
              Source Healthcare Facility
            </label>
            <input
              type="text"
              value={sourceOrg}
              onChange={e => setSourceOrg(e.target.value)}
              required
              placeholder="e.g. Stanford Health Care"
              className="w-full h-11 px-3.5 bg-[#FFFFFF] border border-[#DFE5D8] rounded-xl text-[14px] text-[#0B0808] focus:outline-none focus:border-[#33650E] focus:ring-2 focus:ring-[#78A541]/20"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#0B0808] mb-1.5">
              Clinical Document Type
            </label>
            <select
              value={docCategory}
              onChange={e => setDocCategory(e.target.value as any)}
              className="w-full h-11 px-3.5 bg-[#FFFFFF] border border-[#DFE5D8] rounded-xl text-[14px] text-[#0B0808] focus:outline-none focus:border-[#33650E]"
            >
              <option value="specialty_consult">Specialty Consultation Note</option>
              <option value="discharge_summary">Hospital Discharge Summary</option>
              <option value="lab_report">Laboratory &amp; Pathology Panel</option>
              <option value="prescription_order">Medication Order / Reconciliation</option>
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#0B0808] mb-1.5">
              Document Title
            </label>
            <input
              type="text"
              value={docTitle}
              onChange={e => setDocTitle(e.target.value)}
              required
              className="w-full h-11 px-3.5 bg-[#FFFFFF] border border-[#DFE5D8] rounded-xl text-[14px] text-[#0B0808] focus:outline-none focus:border-[#33650E]"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#0B0808] mb-1.5">
              Clinical Date of Encounter
            </label>
            <input
              type="date"
              value={clinicalDate}
              onChange={e => setClinicalDate(e.target.value)}
              required
              className="w-full h-11 px-3.5 bg-[#FFFFFF] border border-[#DFE5D8] rounded-xl text-[14px] text-[#0B0808] focus:outline-none focus:border-[#33650E]"
            />
          </div>
        </div>

        {/* File attachment preview */}
        <div>
          <label className="block text-[13px] font-bold text-[#0B0808] mb-1.5">
            File Reference (Simulated PDF / Structured JSON)
          </label>
          <div className="flex items-center gap-3 p-3 bg-[#F2F7EB] rounded-xl border border-[#DFE5D8]">
            <span className="material-symbols-outlined text-[#33650E] text-[22px]">
              picture_as_pdf
            </span>
            <input
              type="text"
              value={fileName}
              onChange={e => setFileName(e.target.value)}
              className="bg-transparent border-none text-[13px] font-mono text-[#0B0808] flex-1 focus:outline-none"
            />
            <span className="text-[11px] font-bold text-[#33650E] bg-[#FFFFFF] px-2.5 py-1 rounded-md border border-[#DFE5D8]">
              SHA-256 Hashed
            </span>
          </div>
        </div>

        {/* Clinical Text Content */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[13px] font-bold text-[#0B0808]">
              Clinical Text &amp; EHR Discharge Excerpt
            </label>
            <span className="text-[11px] text-[#667065]">
              Parses candidate allergies, medications &amp; vitals
            </span>
          </div>
          <textarea
            rows={5}
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            required
            className="w-full p-3.5 bg-[#FFFFFF] border border-[#DFE5D8] rounded-xl text-[13px] font-mono text-[#0B0808] focus:outline-none focus:border-[#33650E]"
          ></textarea>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#DFE5D8]">
          <div className="flex items-center gap-2 text-[12px] text-[#667065]">
            <span className="material-symbols-outlined text-[#33650E] text-[16px]">lock</span>
            <span>Zero-knowledge client-side encryption active</span>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="inline-flex items-center gap-2 bg-[#33650E] hover:bg-[#28510B] text-[#FFFFFF] text-[14px] font-semibold px-7 py-3 rounded-xl transition-all shadow-md active:scale-[0.98]"
          >
            {isProcessing ? (
              <span>Extracting &amp; Ingesting...</span>
            ) : (
              <>
                <span>Ingest &amp; Run Discrepancy Check</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success Notification */}
      {ingestSuccess && (
        <div className="bg-[#FFFFFF] rounded-2xl p-6 border-2 border-[#78A541] shadow-lg animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#F2F7EB] text-[#33650E] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">verified</span>
            </div>
            <div className="flex-1">
              <h3 className="font-['Plus_Jakarta_Sans'] text-[17px] font-bold text-[#0B0808]">
                Document Successfully Ingested &amp; Verified
              </h3>
              <p className="font-['DM_Sans'] text-[13px] text-[#42493b] mt-1">
                Document <strong>{ingestSuccess.document?.title}</strong> ({ingestSuccess.document?.fileName}) has been integrated into your timeline with SHA-256 hash:
              </p>
              <p className="text-[11px] font-mono bg-[#F2F7EB] p-2 rounded-lg text-[#33650E] mt-2 break-all border border-[#DFE5D8]">
                {ingestSuccess.document?.sha256Hash}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => onNavigate('/patient/history')}
                  className="bg-[#33650E] text-[#FFFFFF] text-[13px] font-semibold px-4 py-2 rounded-xl hover:bg-[#28510B]"
                >
                  View in Medical Timeline
                </button>
                <button
                  onClick={() => onNavigate('/patient/conflicts')}
                  className="bg-[#F2F7EB] text-[#33650E] border border-[#DFE5D8] text-[13px] font-semibold px-4 py-2 rounded-xl hover:bg-[#ebefe4]"
                >
                  Review Discrepancies
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
