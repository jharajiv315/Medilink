import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import type { AccessGrant } from '../types/medilink.ts';
import { UserRoundPlus, ReceiptText, ShieldCheck, TriangleAlert, Hourglass, ArrowRight } from 'lucide-react';

interface ClinicDashboardProps {
  onNavigate: (path: string) => void;
}

export const ClinicDashboard: React.FC<ClinicDashboardProps> = ({ onNavigate }) => {
  const { currentUser, getAuthHeaders } = useAuth();
  const [dashboardData, setDashboardData] = useState<{
    clinician?: any;
    organization?: any;
    activeGrants?: AccessGrant[];
    pendingRequests?: AccessGrant[];
    unresolvedDiscrepanciesCount?: number;
  }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/clinic/dashboard', {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        setDashboardData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activeGrants = dashboardData.activeGrants || [];
  const pendingRequests = dashboardData.pendingRequests || [];
  const reviewGrant = activeGrants.find(grant =>
    grant.patientId === 'DEMO-P001' && grant.approvedCategories.includes('Allergies')
  );

  const clinicianName = currentUser.role === 'clinician' ? currentUser.name : (dashboardData.clinician?.name || 'Dr. Marcus Vance, MD');
  const clinicianTitle = currentUser.role === 'clinician' ? (currentUser.title || 'Attending Physician') : 'Attending Physician & Clinical Lead';
  const clinicianOrg = currentUser.role === 'clinician' ? (currentUser.organization || 'Sutter Health') : 'Sutter Health Clinical Network';
  const badgeNumber = currentUser.badgeNumber || 'MD-84920';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 space-y-8">
      {/* Clinician Header */}
      <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#DFE5D8] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2F7EB] text-[#33650E] text-[11px] font-bold border border-[#DFE5D8] mb-2">
            <span className="w-2 h-2 rounded-full bg-[#78A541]" />
            <span>Clinician workspace · {badgeNumber}</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-[28px] sm:text-[32px] font-bold text-[#0B0808]">
            Welcome back, {clinicianName}.
          </h1>
          <p className="font-['DM_Sans'] text-[15px] text-[#42493b] mt-1">
            {clinicianTitle} · {clinicianOrg}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('/clinic/access-requests')}
            className="inline-flex items-center gap-2 bg-[#33650E] hover:bg-[#28510B] text-[#FFFFFF] text-[14px] font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.98]"
          >
            <UserRoundPlus className="w-[18px] h-[18px] shrink-0" />
            <span>Request records</span>
          </button>
          <button
            onClick={() => onNavigate('/patient/access-history')}
            className="inline-flex items-center gap-2 bg-[#F2F7EB] hover:bg-[#ebefe4] text-[#33650E] border border-[#DFE5D8] text-[14px] font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <ReceiptText className="w-[18px] h-[18px] shrink-0" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#DFE5D8] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-bold text-[#667065] uppercase">Active Handoffs</span>
            <ShieldCheck className="w-5 h-5 text-[#33650E]" />
          </div>
          <div className="font-['Plus_Jakarta_Sans'] text-[32px] font-bold text-[#0B0808]">
            {activeGrants.length} Active
          </div>
          <p className="text-[12px] text-[#42493b] mt-1 font-medium">Authorized by patient token</p>
        </div>

        <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#DFE5D8] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-bold text-[#A33837] uppercase">
              Discrepancies to review
            </span>
            <TriangleAlert className="w-5 h-5 text-[#A33837]" />
          </div>
          <div className="font-['Plus_Jakarta_Sans'] text-[32px] font-bold text-[#A33837]">
            {dashboardData.unresolvedDiscrepanciesCount ?? 0} to review
          </div>
          <p className="text-[12px] text-[#42493b] mt-1 font-medium">Unresolved clinical discrepancies</p>
        </div>

        <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#DFE5D8] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-bold text-[#667065] uppercase">Pending Requests</span>
            <Hourglass className="w-5 h-5 text-[#985C12]" />
          </div>
          <div className="font-['Plus_Jakarta_Sans'] text-[32px] font-bold text-[#0B0808]">
            {pendingRequests.length} Pending
          </div>
          <p className="text-[12px] text-[#42493b] mt-1 font-medium">Awaiting patient consent</p>
        </div>
      </div>

      {/* Active Clinical Handoffs Section */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#DFE5D8] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#DFE5D8]">
          <div>
            <h2 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[#0B0808]">
              Authorized Patient Handoffs Ready for Clinical Review
            </h2>
            <p className="text-[13px] text-[#667065]">
              Patients who have granted time-bound, category-specific access
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#F2F7EB] text-[#33650E] text-[11px] font-bold self-start">
            {activeGrants.length} active
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-[#667065]">Loading clinical authorizations...</div>
        ) : activeGrants.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="font-semibold text-[#0B0808]">No active handoffs yet</p>
            <p className="text-[13px] text-[#667065]">Request access and the patient can approve the records you need.</p>
            <button onClick={() => onNavigate('/clinic/access-requests')} className="text-[13px] font-bold text-[#33650E] hover:underline">Request patient records</button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeGrants.map(grant => (
              <div
                key={grant.id}
                className="p-5 sm:p-6 rounded-2xl bg-[#F2F7EB] border border-[#DFE5D8] flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-[#78A541] transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <h3 className="font-['Plus_Jakarta_Sans'] text-[17px] font-bold text-[#0B0808]">
                      {grant.patientName}
                    </h3>
                    <span className="text-[11px] font-mono bg-[#FFFFFF] px-2.5 py-0.5 rounded-full border border-[#DFE5D8] text-[#33650E] font-bold">
                      {grant.patientId}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FFFFFF] text-[#33650E] text-[11px] font-bold">
                      Active until {grant.expiresAt?.split('T')[0] || 'revoked'}
                    </span>
                  </div>

                  <p className="text-[13px] text-[#42493b]">
                    <strong>Clinical Purpose:</strong> {grant.purpose}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[12px]">
                    <span className="text-[#667065] font-semibold">Authorized Scopes:</span>
                    {grant.approvedCategories.map(cat => (
                      <span
                        key={cat}
                        className="px-2 py-0.5 rounded-md bg-[#FFFFFF] text-[#33650E] text-[11px] font-bold border border-[#DFE5D8]"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                  <button
                    onClick={() => onNavigate(`/clinic/handoff/${grant.id}`)}
                    className="inline-flex items-center justify-center gap-2 bg-[#33650E] hover:bg-[#28510B] text-[#FFFFFF] text-[14px] font-semibold px-5 py-3 rounded-xl transition-all shadow-md active:scale-[0.98]"
                  >
                    <span>Open Clinical Handoff</span>
                    <ArrowRight className="w-[18px] h-[18px]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Discrepancy Spotlight Alert */}
      {(dashboardData.unresolvedDiscrepanciesCount ?? 0) > 0 && reviewGrant && <div className="bg-[#FFF5E5] border border-[#985C12]/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#FFF0EF] text-[#A33837] flex items-center justify-center shrink-0">
            <TriangleAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[#0B0808]">
              Unreconciled Contradiction: Penicillin Allergy Notation
            </h3>
            <p className="text-[13px] text-[#42493b] mt-0.5">
              Ananya Sharma has contradictory penicillin records between Memorial Hospital (severe
              rash) and Allergy Center (negative challenge). Open handoff to review quotes and mark
              reconciled.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            onNavigate(`/clinic/handoff/${reviewGrant.id}`);
          }}
          className="bg-[#985C12] hover:bg-[#7e4b0e] text-[#FFFFFF] text-[13px] font-semibold px-4 py-2 rounded-xl shrink-0 transition-colors"
        >
          Reconcile in Workspace
        </button>
      </div>}
    </div>
  );
};
