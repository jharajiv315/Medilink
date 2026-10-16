import React, { useState } from 'react';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [reconciledInHero, setReconciledInHero] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'How does MediLink protect sensitive medical data and prevent unauthorized sharing?',
      a: 'MediLink operates under patient-controlled zero-knowledge consent architecture. No healthcare provider can inspect records without an active, time-bound cryptographic access grant explicitly authorized by you. Furthermore, you choose specific clinical categories (e.g., Cardiology, Allergies, Labs) and can revoke access immediately with a single click.'
    },
    {
      q: 'What is Evidence-Linked Conflict Detection and does it make medical decisions?',
      a: 'MediLink never autonomously confirms diagnoses or alters treatment plans. Instead, its deterministic engine detects documented contradictions—such as conflicting penicillin allergy records or disparate medication dosages—and displays both original clinical source documents side-by-side so consulting clinicians can safely clarify and reconcile discrepancies before prescribing.'
    },
    {
      q: 'Can receiving clinicians update or overwrite past hospital records?',
      a: 'No. Original hospital discharge summaries and laboratory PDFs remain permanently unaltered and cryptographically hashed with SHA-256 provenance. Authorized clinicians record structured reconciliations and clinical notes that append to the patient’s longitudinal timeline without destroying historical audit trails.'
    },
    {
      q: 'What document formats and EHR systems are supported?',
      a: 'MediLink supports native FHIR R4 interoperability, structured clinical JSON, and machine-readable PDF discharge and consultation notes from major health systems including Epic, Cerner, and independent specialty clinics.'
    }
  ];

  return (
    <div className="flex flex-col w-full text-[#181d16] bg-[#f7fbf0]">
      {/* ================= HERO SECTION ================= */}
      <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 pt-8 pb-16 lg:pt-14 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Value Proposition */}
          <div className="lg:col-span-6 flex flex-col items-start gap-6">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#F2F7EB] border border-[#DFE5D8] shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#33650E] animate-pulse"></span>
              <span className="font-['DM_Sans'] text-[12px] font-bold text-[#33650E] tracking-wide">
                Smarter Healthcare. Connected Records.
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="font-['Plus_Jakarta_Sans'] text-[38px] sm:text-[54px] lg:text-[60px] text-[#0B0808] font-bold tracking-tight leading-[1.08]">
              Your Health Records, <br className="hidden sm:inline" />
              <span className="text-[#416905]">Finally Connected.</span>
            </h1>

            {/* Supporting Body Copy */}
            <p className="font-['DM_Sans'] text-[17px] sm:text-[18px] text-[#42493b] max-w-xl leading-relaxed">
              All your medical records in one secure place. Understand your health history, identify
              information that needs review, and share the right records with your next healthcare
              provider.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-2">
              <button
                onClick={() => onNavigate('/patient/dashboard')}
                className="inline-flex items-center justify-center gap-2 bg-[#33650E] hover:bg-[#28510B] text-[#FFFFFF] font-['DM_Sans'] text-[15px] font-semibold px-7 py-3.5 rounded-xl shadow-md transition-all duration-200 active:scale-[0.98]"
              >
                <span>Connect My Records</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('how-it-works');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center justify-center gap-2 bg-[#FFFFFF] hover:bg-[#F2F7EB] text-[#0B0808] border border-[#DFE5D8] font-['DM_Sans'] text-[15px] font-semibold px-6 py-3.5 rounded-xl shadow-sm transition-colors"
              >
                <span>Explore MediLink</span>
                <span className="material-symbols-outlined text-[18px] text-[#42493b]">
                  expand_more
                </span>
              </button>
            </div>

            {/* Trust Badges Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-[#42493b] font-['DM_Sans'] text-[12px]">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-[#33650E] text-[16px]">
                  verified
                </span>
                Patient-controlled consent
              </span>
              <span className="text-[#c2c9b7]">•</span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-[#33650E] text-[16px]">lock</span>
                Zero-knowledge encryption
              </span>
              <span className="text-[#c2c9b7]">•</span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-[#33650E] text-[16px]">
                  sync_alt
                </span>
                FHIR R4 interoperability
              </span>
            </div>
          </div>

          {/* Right Column: Visual Composition with Layered Panels */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl bg-[#F2F7EB] p-3 sm:p-4 shadow-xl border border-[#DFE5D8] overflow-hidden">
              {/* Primary Doctor/Patient Consultation Photo from Google Stitch */}
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] w-full bg-[#ebefe4]">
                <img
                  alt="Authentic healthcare consultation in a calm, modern clinic"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3snnLrxXlUdbHeLxY_0lxmfXwQLnnjN1ewTclfYTHj28TWFjJC8krWgIYm_6F8hE65VjrDW7BXo0JWWjj3zaUKPYrwfeb-N8xXbvEoXu3ThqKD96ZwO99xL8Y6o7WOGMfL1oouRI-cqcE5bYyQZ4KavWpGfKLmFvtLd1r1jg8KUKYOQTn2gskdrofQkpKY72BvZYMmX3I33cVbSzCPHQOD428YBsxbCJi1vsk93SoVZHh3kor_xeJ"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none"></div>
              </div>

              {/* Layered Panel 1: Top Right Providers Connected */}
              <div className="absolute top-7 right-7 max-w-[240px] bg-[#FFFFFF]/95 backdrop-blur-md p-3.5 rounded-xl shadow-lg border border-[#DFE5D8] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#667065] uppercase tracking-wider">
                    Live Sync
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-[#214c00] font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#78A541] animate-ping"></span>
                    Active
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#F2F7EB] flex items-center justify-center text-[#33650E]">
                    <span className="material-symbols-outlined text-[20px]">domain</span>
                  </div>
                  <div className="leading-tight">
                    <p className="text-[13px] text-[#0B0808] font-bold">3 Health Systems</p>
                    <p className="text-[11px] text-[#667065]">Memorial • Mayo • Sutter</p>
                  </div>
                </div>
              </div>

              {/* Layered Panel 2: Bottom Left Records Summary */}
              <div
                onClick={() => onNavigate('/patient/history')}
                className="cursor-pointer absolute bottom-16 left-6 sm:left-7 max-w-[290px] bg-[#FFFFFF]/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-[#DFE5D8] flex flex-col gap-2.5 hover:scale-[1.02] transition-transform"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#33650E] text-[18px]">
                    folder_managed
                  </span>
                  <span className="text-[13px] text-[#0B0808] font-bold">
                    Unified Medical History
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[12px] font-semibold">
                  <span className="px-2 py-0.5 rounded-md bg-[#F2F7EB] text-[#33650E]">
                    14 Consults
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#F2F7EB] text-[#33650E]">
                    28 Labs
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#FFF5E5] text-[#985C12] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#985C12]"></span> 1 Flagged
                  </span>
                </div>
              </div>

              {/* Layered Panel 3: Bottom Right Active Consent Pill */}
              <div
                onClick={() => onNavigate('/patient/consents')}
                className="cursor-pointer absolute bottom-7 right-7 bg-[#33650E] text-[#FFFFFF] px-3.5 py-2 rounded-full shadow-md flex items-center gap-2 hover:bg-[#28510B] transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-[#bdef81]">
                  verified_user
                </span>
                <span className="text-[12px] font-semibold">Active Consent: Dr. Vance (30d pass)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= THREE-STEP PROCESS STRIP ================= */}
      <section className="w-full bg-[#F2F7EB] py-16 lg:py-20 border-y border-[#DFE5D8]" id="how-it-works">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-xl">
              <span className="text-[11px] uppercase tracking-widest text-[#33650E] font-bold">
                Clinical Pathway
              </span>
              <h2 className="font-['Plus_Jakarta_Sans'] text-[28px] sm:text-[36px] text-[#0B0808] font-bold mt-2">
                How MediLink Bridges Your Care
              </h2>
            </div>
            <p className="font-['DM_Sans'] text-[15px] text-[#42493b] max-w-md">
              A seamless flow designed to turn fragmented clinical notes and lab results into
              verifiable, unified patient health continuity.
            </p>
          </div>

          {/* 3-Step Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-[#FFFFFF] p-8 rounded-2xl border border-[#DFE5D8] shadow-sm flex flex-col justify-between h-full group hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="w-10 h-10 rounded-xl bg-[#F2F7EB] flex items-center justify-center text-[18px] text-[#33650E] font-bold font-['Plus_Jakarta_Sans']">
                    1
                  </span>
                  <span className="material-symbols-outlined text-[#72796a] group-hover:text-[#33650E] transition-colors">
                    cloud_sync
                  </span>
                </div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[#0B0808] mb-3">
                  Connect &amp; Ingest
                </h3>
                <p className="font-['DM_Sans'] text-[14px] text-[#42493b] leading-relaxed">
                  Instantly authenticate your patient portals or securely upload historical hospital
                  discharge summaries and laboratory PDFs.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#F4F5F1] flex items-center gap-2 text-[#33650E] font-semibold text-[13px]">
                <span>Direct FHIR sync enabled</span>
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[#FFFFFF] p-8 rounded-2xl border border-[#DFE5D8] shadow-sm flex flex-col justify-between h-full group hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="w-10 h-10 rounded-xl bg-[#F2F7EB] flex items-center justify-center text-[18px] text-[#33650E] font-bold font-['Plus_Jakarta_Sans']">
                    2
                  </span>
                  <span className="material-symbols-outlined text-[#72796a] group-hover:text-[#33650E] transition-colors">
                    insights
                  </span>
                </div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[#0B0808] mb-3">
                  Longitudinal AI Synthesis
                </h3>
                <p className="font-['DM_Sans'] text-[14px] text-[#42493b] leading-relaxed">
                  Proprietary clinical models cross-reference encounters, detecting discrepancies in
                  medication dosages, conflicting diagnoses, and allergies.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#F4F5F1] flex items-center gap-2 text-[#33650E] font-semibold text-[13px]">
                <span>Deterministic cross-matching</span>
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-[#FFFFFF] p-8 rounded-2xl border border-[#DFE5D8] shadow-sm flex flex-col justify-between h-full group hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="w-10 h-10 rounded-xl bg-[#F2F7EB] flex items-center justify-center text-[18px] text-[#33650E] font-bold font-['Plus_Jakarta_Sans']">
                    3
                  </span>
                  <span className="material-symbols-outlined text-[#72796a] group-hover:text-[#33650E] transition-colors">
                    enhanced_encryption
                  </span>
                </div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[#0B0808] mb-3">
                  Granular Consent &amp; Handoff
                </h3>
                <p className="font-['DM_Sans'] text-[14px] text-[#42493b] leading-relaxed">
                  Authorize your new specialist with tailored permissions. Revoke or scope access to
                  specific clinics with immutable cryptographic logging.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#F4F5F1] flex items-center gap-2 text-[#33650E] font-semibold text-[13px]">
                <span>Time-bound access tokens</span>
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SIGNATURE CAPABILITIES (5-CARD BENTO) ================= */}
      <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-24" id="features">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[11px] tracking-widest text-[#33650E] font-bold uppercase">
            BETTER RECORDS. BETTER CONTINUITY.
          </span>
          <h2 className="font-['Plus_Jakarta_Sans'] text-[30px] sm:text-[38px] text-[#0B0808] font-bold mt-3">
            Designed for clinical trust and patient empowerment
          </h2>
          <p className="font-['DM_Sans'] text-[16px] text-[#42493b] mt-4">
            Healthcare becomes easier to coordinate when your medical history is organized,
            traceable, and accessible with your permission.
          </p>
        </div>

        {/* 5 Cards Layout (3 Top Row, 2 Wide Bottom Row) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Card 1: Unified Medical History */}
          <div
            onClick={() => onNavigate('/patient/history')}
            className="cursor-pointer bg-[#FFFFFF] p-8 rounded-2xl border border-[#DFE5D8] shadow-sm flex flex-col justify-between hover:shadow-md transition-all group hover:border-[#78A541]"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#F2F7EB] flex items-center justify-center text-[#33650E] mb-6 group-hover:bg-[#33650E] group-hover:text-[#FFFFFF] transition-colors">
                <span className="material-symbols-outlined text-[26px]">history_edu</span>
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[#0B0808] mb-3">
                Unified Medical History
              </h3>
              <p className="font-['DM_Sans'] text-[14px] text-[#42493b] leading-relaxed">
                Chronological longitudinal record bridging hospital admissions, outpatient
                encounters, immunization registries, and diagnostic imaging into one clean timeline.
              </p>
            </div>
            <div className="mt-8 pt-4 flex items-center gap-2 text-[#33650E] font-semibold text-[14px] group-hover:translate-x-1 transition-transform">
              <span>Explore timeline views</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </div>
          </div>

          {/* Card 2: Conflict Detection */}
          <div
            onClick={() => onNavigate('/patient/conflicts')}
            className="cursor-pointer bg-[#FFFFFF] p-8 rounded-2xl border border-[#DFE5D8] shadow-sm flex flex-col justify-between hover:shadow-md transition-all group hover:border-[#78A541]"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#F2F7EB] flex items-center justify-center text-[#33650E] mb-6 group-hover:bg-[#33650E] group-hover:text-[#FFFFFF] transition-colors">
                <span className="material-symbols-outlined text-[26px]">rule</span>
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[#0B0808] mb-3">
                Conflict Detection
              </h3>
              <p className="font-['DM_Sans'] text-[14px] text-[#42493b] leading-relaxed">
                Automatically highlights clinical contradictions—such as conflicting penicillin
                allergy notations or redundant drug interactions—with direct source citations.
              </p>
            </div>
            <div className="mt-8 pt-4 flex items-center gap-2 text-[#33650E] font-semibold text-[14px] group-hover:translate-x-1 transition-transform">
              <span>See conflict engine</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </div>
          </div>

          {/* Card 3: Closed-Loop Handoffs */}
          <div
            onClick={() => onNavigate('/clinic/handoff/grant-sutter-01')}
            className="cursor-pointer bg-[#FFFFFF] p-8 rounded-2xl border border-[#DFE5D8] shadow-sm flex flex-col justify-between hover:shadow-md transition-all group hover:border-[#78A541]"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#F2F7EB] flex items-center justify-center text-[#33650E] mb-6 group-hover:bg-[#33650E] group-hover:text-[#FFFFFF] transition-colors">
                <span className="material-symbols-outlined text-[26px]">
                  sync_saved_locally
                </span>
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[#0B0808] mb-3">
                Closed-Loop Handoffs
              </h3>
              <p className="font-['DM_Sans'] text-[14px] text-[#42493b] leading-relaxed">
                Clinician-reviewed updates with full FHIR provenance, empowering incoming consulting
                physicians to verify and reconcile conflicting data points before treatment begins.
              </p>
            </div>
            <div className="mt-8 pt-4 flex items-center gap-2 text-[#33650E] font-semibold text-[14px] group-hover:translate-x-1 transition-transform">
              <span>Clinical handoff protocol</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </div>
          </div>
        </div>

        {/* Bottom Row: 2 Wide Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 4: Secure Patient-Controlled Sharing */}
          <div
            onClick={() => onNavigate('/patient/consents')}
            className="cursor-pointer bg-[#FFFFFF] p-8 rounded-2xl border border-[#DFE5D8] shadow-sm flex flex-col justify-between hover:shadow-md transition-all group hover:border-[#78A541]"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#F2F7EB] flex items-center justify-center text-[#33650E] mb-6 group-hover:bg-[#33650E] group-hover:text-[#FFFFFF] transition-colors">
                <span className="material-symbols-outlined text-[26px]">lock_person</span>
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[#0B0808] mb-3">
                Secure Patient-Controlled Sharing
              </h3>
              <p className="font-['DM_Sans'] text-[14px] text-[#42493b] leading-relaxed">
                Granular category gating. Choose exactly which clinical departments or specialists
                receive your cardiology waveforms, behavioral health session notes, or routine blood
                panels.
              </p>
            </div>
            <div className="mt-8 pt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#33650E] font-semibold text-[14px] group-hover:translate-x-1 transition-transform">
                <span>Configure access scope</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#F2F7EB] text-[#33650E] text-[11px] font-bold">
                Granular ACLs
              </span>
            </div>
          </div>

          {/* Card 5: Transparent Access and Audit History */}
          <div
            onClick={() => onNavigate('/patient/access-history')}
            className="cursor-pointer bg-[#FFFFFF] p-8 rounded-2xl border border-[#DFE5D8] shadow-sm flex flex-col justify-between hover:shadow-md transition-all group hover:border-[#78A541]"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#F2F7EB] flex items-center justify-center text-[#33650E] mb-6 group-hover:bg-[#33650E] group-hover:text-[#FFFFFF] transition-colors">
                <span className="material-symbols-outlined text-[26px]">receipt_long</span>
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[#0B0808] mb-3">
                Transparent Access &amp; Audit History
              </h3>
              <p className="font-['DM_Sans'] text-[14px] text-[#42493b] leading-relaxed">
                An immutable, timestamped ledger records every hospital, specialist, or
                administrative staff member who reads, reconciles, or exports your longitudinal
                clinical file.
              </p>
            </div>
            <div className="mt-8 pt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#33650E] font-semibold text-[14px] group-hover:translate-x-1 transition-transform">
                <span>Audit trail architecture</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#F2F7EB] text-[#33650E] text-[11px] font-bold">
                Zero-Tamper Ledger
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CLINICIAN WORKFLOW INTERACTIVE TEASER ================= */}
      <section className="w-full bg-[#FFFFFF] py-20 lg:py-24 border-y border-[#DFE5D8]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Text Explanation */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#F2F7EB] border border-[#DFE5D8] w-fit text-[#33650E] text-[11px] font-bold">
                <span className="material-symbols-outlined text-[16px]">troubleshoot</span>
                <span>Clinical Verification Workflow</span>
              </div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-[28px] sm:text-[36px] text-[#0B0808] font-bold leading-tight">
                Side-by-side reconciliation for error-free patient handoffs
              </h2>
              <p className="font-['DM_Sans'] text-[15px] text-[#42493b] leading-relaxed">
                When past providers have conflicting records, MediLink flags the discrepancy before
                medications are ordered. Both patient and clinician can review source documents with
                full transparent context.
              </p>
              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#33650E] text-[20px] mt-0.5">
                    check_circle
                  </span>
                  <div>
                    <h4 className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[#0B0808]">
                      Source-level provenance
                    </h4>
                    <p className="font-['DM_Sans'] text-[13px] text-[#42493b]">
                      Jump directly into the exact clinical paragraph in the originating 2021
                      discharge PDF.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#33650E] text-[20px] mt-0.5">
                    check_circle
                  </span>
                  <div>
                    <h4 className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[#0B0808]">
                      Patient affirmation toggle
                    </h4>
                    <p className="font-['DM_Sans'] text-[13px] text-[#42493b]">
                      Patients can clarify symptoms before physician sign-off, closing the loop safely.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Discrepancy UI Mockup & Live Interactive Card */}
            <div className="lg:col-span-7 bg-[#F2F7EB] p-6 sm:p-8 rounded-3xl border border-[#DFE5D8] shadow-sm">
              <div className="bg-[#FFFFFF] rounded-2xl p-6 shadow-sm border border-[#DFE5D8]">
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3 border-b border-[#F4F5F1]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FFF0EF] text-[#A33837] flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-[20px]">warning</span>
                    </div>
                    <div>
                      <h4 className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[#0B0808]">
                        Discrepancy Flag: Penicillin Sensitivity
                      </h4>
                      <p className="font-['DM_Sans'] text-[12px] text-[#667065]">
                        Patient ID: ML-89204 (Ananya Sharma) • Reconcile before consultation
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold w-fit ${
                    reconciledInHero ? 'bg-[#F2F7EB] text-[#33650E]' : 'bg-[#FFF5E5] text-[#985C12]'
                  }`}>
                    {reconciledInHero ? 'Reconciled & Signed' : 'Action Required'}
                  </span>
                </div>

                {/* Discrepancy Split Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                  {/* Source A */}
                  <div className="bg-[#F2F7EB] p-4 rounded-xl border border-[#DFE5D8] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[12px] text-[#42493b] font-bold">
                          Memorial Hospital (2021)
                        </span>
                        <span className="text-[11px] text-[#A33837] font-bold">Allergy Listed</span>
                      </div>
                      <p className="text-[14px] text-[#0B0808] font-bold">
                        Severe Penicillin Allergy
                      </p>
                      <p className="text-[13px] text-[#42493b] mt-1 italic">
                        "Patient reported skin hives &amp; mild throat swelling after oral
                        amoxicillin intake in childhood."
                      </p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-[#DFE5D8] text-[11px] text-[#667065] flex items-center gap-1 font-mono">
                      <span className="material-symbols-outlined text-[14px]">attachment</span>
                      <span>Discharge_Summary_Oct21.pdf</span>
                    </div>
                  </div>

                  {/* Source B */}
                  <div className="bg-[#F2F7EB] p-4 rounded-xl border border-[#DFE5D8] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[12px] text-[#42493b] font-bold">
                          Allergy &amp; Asthma Center (2023)
                        </span>
                        <span className="text-[11px] text-[#33650E] font-bold">Test Negative</span>
                      </div>
                      <p className="text-[14px] text-[#0B0808] font-bold">
                        Skin Prick &amp; Oral Challenge: Passed
                      </p>
                      <p className="text-[13px] text-[#42493b] mt-1 italic">
                        "Full penicilloyl-polylysine skin prick was negative. 250mg oral challenge
                        completed with zero reaction."
                      </p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-[#DFE5D8] text-[11px] text-[#667065] flex items-center gap-1 font-mono">
                      <span className="material-symbols-outlined text-[14px]">attachment</span>
                      <span>Lab_Report_SkinPrick_2023.pdf</span>
                    </div>
                  </div>
                </div>

                {/* Action footer */}
                <div className="mt-2 pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#F4F5F1] p-3.5 rounded-xl border border-[#DFE5D8]">
                  <span className="text-[12px] text-[#42493b] flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-[#33650E] text-[18px]">
                      verified
                    </span>
                    Patient affirmed: No symptoms upon amoxicillin re-challenge.
                  </span>

                  {reconciledInHero ? (
                    <button
                      onClick={() => onNavigate('/clinic/handoff/grant-sutter-01')}
                      className="inline-flex items-center justify-center gap-1 bg-[#33650E] text-[#FFFFFF] text-[12px] px-4 py-2 rounded-lg font-bold shadow-sm"
                    >
                      <span>Open in Clinical Workspace</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setReconciledInHero(true)}
                      className="bg-[#33650E] text-[#FFFFFF] text-[12px] px-4 py-2 rounded-lg hover:bg-[#28510B] transition-colors font-bold shadow-sm"
                    >
                      Mark Reconciled by Clinician
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TRUST & SECURITY GOVERNANCE STRIP ================= */}
      <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="bg-[#FFFFFF] rounded-2xl p-8 sm:p-10 border border-[#DFE5D8] shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4 max-w-md">
            <div className="w-14 h-14 rounded-2xl bg-[#F2F7EB] flex items-center justify-center text-[#33650E] shrink-0 border border-[#DFE5D8]">
              <span className="material-symbols-outlined text-[32px]">shield_lock</span>
            </div>
            <div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[#0B0808]">
                Enterprise-Grade Clinical Governance
              </h3>
              <p className="font-['DM_Sans'] text-[13px] text-[#42493b] mt-1 leading-relaxed">
                Built under rigorous medical privacy frameworks to keep sensitive patient records
                fortified at every touchpoint.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full md:w-auto">
            <div className="flex flex-col items-center sm:items-start p-3 bg-[#F2F7EB] rounded-xl text-center sm:text-left border border-[#DFE5D8]">
              <span className="font-['Plus_Jakarta_Sans'] text-[18px] text-[#0B0808] font-bold">
                HIPAA
              </span>
              <span className="font-['DM_Sans'] text-[12px] text-[#42493b] mt-0.5">Compliant</span>
            </div>
            <div className="flex flex-col items-center sm:items-start p-3 bg-[#F2F7EB] rounded-xl text-center sm:text-left border border-[#DFE5D8]">
              <span className="font-['Plus_Jakarta_Sans'] text-[18px] text-[#0B0808] font-bold">
                SOC 2
              </span>
              <span className="font-['DM_Sans'] text-[12px] text-[#42493b] mt-0.5">
                Type II Audited
              </span>
            </div>
            <div className="flex flex-col items-center sm:items-start p-3 bg-[#F2F7EB] rounded-xl text-center sm:text-left border border-[#DFE5D8]">
              <span className="font-['Plus_Jakarta_Sans'] text-[18px] text-[#0B0808] font-bold">
                AES-256
              </span>
              <span className="font-['DM_Sans'] text-[12px] text-[#42493b] mt-0.5">
                Zero-Knowledge
              </span>
            </div>
            <div className="flex flex-col items-center sm:items-start p-3 bg-[#F2F7EB] rounded-xl text-center sm:text-left border border-[#DFE5D8]">
              <span className="font-['Plus_Jakarta_Sans'] text-[18px] text-[#0B0808] font-bold">
                FHIR R4
              </span>
              <span className="font-['DM_Sans'] text-[12px] text-[#42493b] mt-0.5">
                Native Protocol
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section className="w-full max-w-4xl mx-auto px-6 lg:px-12 pb-16" id="faq">
        <div className="text-center mb-10">
          <span className="text-[11px] tracking-widest text-[#33650E] font-bold uppercase">
            FREQUENTLY ASKED QUESTIONS
          </span>
          <h2 className="font-['Plus_Jakarta_Sans'] text-[28px] sm:text-[34px] font-bold text-[#0B0808] mt-2">
            Clear Answers on Privacy, Interoperability &amp; Accuracy
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-[#FFFFFF] rounded-2xl border border-[#DFE5D8] overflow-hidden transition-all shadow-sm"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full text-left p-5 flex items-center justify-between gap-4 font-['Plus_Jakarta_Sans'] font-bold text-[15px] text-[#0B0808]"
              >
                <span>{faq.q}</span>
                <span className="material-symbols-outlined text-[#33650E] transition-transform">
                  {openFaq === idx ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 pt-1 text-[14px] text-[#42493b] leading-relaxed border-t border-[#F4F5F1]">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ================= FINAL HIGH-CONVERSION CTA BANNER ================= */}
      <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 pb-24">
        <div className="bg-[#F2F7EB] rounded-3xl p-10 sm:p-16 relative overflow-hidden border border-[#DFE5D8] shadow-sm">
          {/* Decorative Organic Radial Glow */}
          <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-[#a5d56b]/20 blur-3xl pointer-events-none"></div>

          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#DFE5D8] mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#33650E]"></span>
              <span className="text-[12px] font-bold text-[#33650E]">
                Immediate Setup • No EHR Migration Needed
              </span>
            </div>

            <h2 className="font-['Plus_Jakarta_Sans'] text-[32px] sm:text-[46px] text-[#0B0808] font-bold leading-tight tracking-tight">
              Take control of your continuous health journey today.
            </h2>

            <p className="font-['DM_Sans'] text-[17px] text-[#42493b] mt-4 mb-8 leading-relaxed">
              Join thousands of patients and leading medical groups connecting clinical clarity across
              boundaries. Your health continuity is one click away.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={() => onNavigate('/patient/dashboard')}
                className="inline-flex items-center justify-center gap-2 bg-[#33650E] hover:bg-[#28510B] text-[#FFFFFF] font-['DM_Sans'] text-[15px] font-semibold px-8 py-4 rounded-xl shadow-md transition-all duration-200 active:scale-[0.98]"
              >
                <span>Start Connecting Your Health</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
              <button
                onClick={() => onNavigate('/clinic/dashboard')}
                className="inline-flex items-center justify-center gap-2 bg-[#FFFFFF] hover:bg-[#F4F5F1] text-[#0B0808] border border-[#DFE5D8] font-['DM_Sans'] text-[15px] font-semibold px-6 py-4 rounded-xl shadow-sm transition-colors"
              >
                <span>For Clinics &amp; Providers</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
