import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { HandoffQr } from '../components/ui/HandoffQr.tsx';
import type { AccessGrant, AccessCategory } from '../types/medilink.ts';

interface PatientConsentsProps {
  onNavigate: (path: string) => void;
}

export const PatientConsents: React.FC<PatientConsentsProps> = ({ onNavigate }) => {
  const { currentUser, getAuthHeaders } = useAuth();
  const patientId = currentUser.patientId!;

  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'expired' | 'revoked'>('active');
  const [loading, setLoading] = useState(true);
  const [modalGrant, setModalGrant] = useState<AccessGrant | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<AccessCategory[]>([]);
  const [durationDays, setDurationDays] = useState(30);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [qrGrant, setQrGrant] = useState<AccessGrant | null>(null);
  const [revokingGrantId, setRevokingGrantId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Prevent background scrolling and viewport jitter when any modal is open
  useEffect(() => {
    if (modalGrant || qrGrant || revokingGrantId) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [modalGrant, qrGrant, revokingGrantId]);

  const allAvailableCategories: AccessCategory[] = [
    'Allergies',
    'Medications',
    'Lab Reports',
    'Consultations',
    'Cardiology',
    'Behavioral Health'
  ];

  const loadGrants = () => {
    setError('');
    fetch(`/api/patients/${patientId}/consents`, {
      headers: getAuthHeaders()
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Unable to load sharing permissions.');
        return data;
      })
      .then(data => {
        if (data.grants) {
          setGrants(data.grants);
        }
        setLoading(false);
      })
      .catch(error => { setError(error.message || 'Unable to connect. Please try again.'); setLoading(false); });
  };

  useEffect(() => {
    loadGrants();
  }, [patientId]);

  const handleRevoke = async (grantId: string) => {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/patients/${patientId}/consents/${grantId}/revoke`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason: 'Patient terminated consent.' })
      });
      if (res.ok) {
        setRevokingGrantId(null);
        loadGrants();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Access could not be revoked. Please try again.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to connect. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!modalGrant || saving) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/patients/${patientId}/consents/${modalGrant.id}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          approvedCategories: selectedCategories,
          durationDays,
          durationMinutes
        })
      });
      if (res.ok) {
        const approvedData = await res.json();
        setModalGrant(null);
        loadGrants();
        // Immediately show QR code modal for phone-to-laptop scanning
        if (approvedData.grant) {
          setQrGrant(approvedData.grant);
        }
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Access could not be approved. Please try again.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to connect. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filteredGrants = grants.filter(g => {
    const effStatus = (g as any).effectiveStatus || g.status;
    return effStatus === activeTab;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 py-8 space-y-8">
      {error && !modalGrant && !revokingGrantId && <div role="alert" className="rounded-2xl border border-[#A33837]/20 bg-[#FFF0EF] p-4 text-sm text-[#A33837]">{error} <button onClick={loadGrants} className="ml-2 font-semibold underline">Reload</button></div>}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#DFE5D8]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2F7EB] text-[#33650E] text-[11px] font-bold border border-[#DFE5D8] mb-2">
            <span className="material-symbols-outlined text-[14px]">lock_person</span>
            <span>Zero-Knowledge Access Control</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-[28px] sm:text-[34px] font-bold text-[#0B0808]">
            Patient-Controlled Sharing &amp; Consent
          </h1>
          <p className="font-['DM_Sans'] text-[15px] text-[#42493b] mt-1">
            Authorize specialists with category-gated, time-bound tokens. Revoke access instantly
            with zero delay.
          </p>
        </div>

        <button
          onClick={loadGrants}
          className="inline-flex items-center gap-2 bg-[#F2F7EB] hover:bg-[#ebefe4] text-[#33650E] border border-[#DFE5D8] text-[14px] font-semibold px-4 py-2.5 rounded-xl transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add_link</span>
          <span>Refresh requests</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#DFE5D8] gap-4 sm:gap-8 overflow-x-auto">
        {(['active', 'pending', 'expired', 'revoked'] as const).map(tab => {
          const count = grants.filter(g => ((g as any).effectiveStatus || g.status) === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 font-['DM_Sans'] text-[14px] font-semibold capitalize transition-all border-b-2 flex items-center gap-2 ${
                activeTab === tab
                  ? 'border-[#33650E] text-[#33650E]'
                  : 'border-transparent text-[#667065] hover:text-[#0B0808]'
              }`}
            >
              <span>{tab} Grants</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full ${
                  activeTab === tab
                    ? 'bg-[#33650E] text-[#FFFFFF]'
                    : 'bg-[#F2F7EB] text-[#42493b]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grant Cards List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-[#667065]">Loading consent ledger...</div>
        ) : filteredGrants.length === 0 ? (
          <div className="p-10 text-center bg-[#FFFFFF] rounded-2xl border border-[#DFE5D8]">
            <span className="material-symbols-outlined text-[#72796a] text-[36px] mb-2">
              shield
            </span>
            <p className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[#0B0808]">
              No {activeTab} access grants found.
            </p>
            <p className="text-[13px] text-[#42493b] mt-1">
              All data access follows strict patient authorization policies.
            </p>
          </div>
        ) : (
          filteredGrants.map(grant => {
            const isPending = grant.status === 'pending';
            const isActive = ((grant as any).effectiveStatus || grant.status) === 'active';
            const isRevoked = grant.status === 'revoked';

            return (
              <div
                key={grant.id}
                className="bg-[#FFFFFF] rounded-2xl border border-[#DFE5D8] p-6 shadow-sm hover:border-[#78A541] transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F4F5F1]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[#0B0808]">
                        {grant.requesterName}
                      </h3>
                      <span className="text-[12px] text-[#667065] font-medium">
                        • {grant.requesterTitle}
                      </span>
                    </div>
                    <p className="text-[13px] text-[#33650E] font-semibold mt-0.5">
                      {grant.requestingOrgName}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase w-fit ${
                      isActive
                        ? 'bg-[#F2F7EB] text-[#33650E]'
                        : isPending
                        ? 'bg-[#FFF5E5] text-[#985C12]'
                        : 'bg-[#FFF0EF] text-[#A33837]'
                    }`}
                  >
                    {isActive
                      ? `Active (${grant.accessDurationDays}d token)`
                      : isPending
                      ? 'Action Required: Pending Approval'
                      : grant.status}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 text-[13px]">
                  <p className="text-[#42493b]">
                    <strong>Clinical Purpose:</strong> {grant.purpose}
                  </p>

                  <div>
                    <strong className="text-[#0B0808] block mb-1">Permitted Categories:</strong>
                    <div className="flex flex-wrap gap-1.5">
                      {(isPending ? grant.requestedCategories : grant.approvedCategories).map(cat => (
                        <span
                          key={cat}
                          className="px-2.5 py-1 rounded-lg bg-[#F2F7EB] text-[#33650E] text-[12px] font-semibold border border-[#DFE5D8]"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-2 text-[12px] text-[#667065]">
                    <span>Requested: {grant.requestedAt.split('T')[0]}</span>
                    {grant.expiresAt && (
                      <span className="text-[#33650E] font-semibold">
                        Expires: {grant.expiresAt.split('T')[0]}
                      </span>
                    )}
                    {grant.revokedAt && (
                      <span className="text-[#A33837] font-semibold">
                        Revoked: {grant.revokedAt.split('T')[0]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="pt-3 border-t border-[#DFE5D8] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#667065]">
                    <span className="material-symbols-outlined text-[14px] text-[#33650E]">
                      key
                    </span>
                    <span className="font-mono">Token ID: {grant.id}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isPending && (
                      <button
                        onClick={() => {
                          setModalGrant(grant);
                          setSelectedCategories(grant.requestedCategories);
                          setDurationDays(grant.accessDurationDays || 30);
                          setDurationMinutes(null);
                          setError('');
                        }}
                        className="bg-[#33650E] hover:bg-[#28510B] text-[#FFFFFF] text-[13px] font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
                      >
                        Review &amp; Approve
                      </button>
                    )}

                    {isActive && (
                      <>
                        <button
                          onClick={() => setQrGrant(grant)}
                          className="inline-flex items-center gap-1.5 bg-[#33650E] hover:bg-[#28510B] text-[#FFFFFF] text-[13px] font-semibold px-3.5 py-2 rounded-xl transition-all shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                          <span>Show QR Code</span>
                        </button>
                        <button
                          onClick={() => setRevokingGrantId(grant.id)}
                          className="bg-[#FFF0EF] hover:bg-[#ffe3e0] text-[#A33837] border border-[#ffdad6] text-[13px] font-semibold px-3.5 py-2 rounded-xl transition-colors"
                        >
                          Revoke Access Immediately
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Revocation Confirmation Dialog */}
      {revokingGrantId && (
        <Modal isOpen onClose={() => { if (!saving) setRevokingGrantId(null); }} title="Revoke access" maxWidth="sm">
          <div className="space-y-4 text-center">
            {error && <p role="alert" className="rounded-xl bg-[#FFF0EF] p-3 text-sm text-[#A33837]">{error}</p>}
            <div className="w-12 h-12 rounded-full bg-[#FFF0EF] text-[#A33837] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">gpp_bad</span>
            </div>
            <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[#0B0808]">
              Revoke Clinical Access Immediately?
            </h3>
            <p className="text-[13px] text-[#42493b] leading-relaxed">
              The clinician will no longer be able to open records through this sharing permission.
            </p>
            <div className="pt-3 flex justify-center gap-3">
              <button
                onClick={() => setRevokingGrantId(null)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-[#484D45] hover:bg-[#F4F5F1]"
              >
                Keep Active
              </button>
              <button
                onClick={() => handleRevoke(revokingGrantId)}
                disabled={saving}
                className="bg-[#A33837] hover:bg-[#861818] text-[#FFFFFF] text-[13px] font-semibold px-5 py-2.5 rounded-xl shadow-md"
              >
                {saving ? 'Revoking…' : 'Confirm revocation'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Approve Modal with Granular Scope Selection */}
      {modalGrant && (
        <Modal isOpen onClose={() => { if (!saving) setModalGrant(null); }} title="Review sharing request" maxWidth="md">
          <div className="space-y-5">
            {error && <p role="alert" className="rounded-xl bg-[#FFF0EF] p-3 text-sm text-[#A33837]">{error}</p>}
            <div className="rounded-xl bg-[#F2F7EB] p-4">
                <p className="text-[13px] font-semibold text-[#33650E]">
                  {modalGrant.requesterName} • {modalGrant.requestingOrgName}
                </p>
            </div>

            <p className="text-[13px] text-[#42493b]">
              <strong>Purpose:</strong> {modalGrant.purpose}
            </p>

            {/* Category selection */}
            <div>
              <span className="block text-[13px] font-bold text-[#0B0808] mb-2">
                Select Permitted Clinical Categories:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {allAvailableCategories.filter(cat => modalGrant.requestedCategories.includes(cat)).map(cat => {
                  const isChecked = selectedCategories.includes(cat);
                  return (
                    <label
                      key={cat}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-[13px] cursor-pointer transition-all ${
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

            {/* Duration */}
            <div>
              <label className="block text-[13px] font-bold text-[#0B0808] mb-1.5">
                Access Duration: {durationMinutes ? `${durationMinutes} Minutes (Live Demo Mode)` : `${durationDays} Days`}
              </label>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => { setDurationMinutes(2); setDurationDays(1); }}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-bold border transition-all ${
                    durationMinutes === 2
                      ? 'bg-[#33650E] text-[#FFFFFF] border-[#33650E]'
                      : 'bg-[#F2F7EB] text-[#33650E] border-[#DFE5D8] hover:bg-[#ebefe4]'
                  }`}
                >
                  ⚡ 2 Minutes (Demo Expiry Gate)
                </button>
                <button
                  type="button"
                  onClick={() => { setDurationMinutes(15); setDurationDays(1); }}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-bold border transition-all ${
                    durationMinutes === 15
                      ? 'bg-[#33650E] text-[#FFFFFF] border-[#33650E]'
                      : 'bg-[#F2F7EB] text-[#33650E] border-[#DFE5D8] hover:bg-[#ebefe4]'
                  }`}
                >
                  ⏱ 15 Minutes (Demo Scope)
                </button>
                <button
                  type="button"
                  onClick={() => { setDurationMinutes(null); setDurationDays(7); }}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-bold border transition-all ${
                    durationMinutes === null && durationDays === 7
                      ? 'bg-[#33650E] text-[#FFFFFF] border-[#33650E]'
                      : 'bg-[#F2F7EB] text-[#42493b] border-[#DFE5D8] hover:bg-[#ebefe4]'
                  }`}
                >
                  7 Days
                </button>
                <button
                  type="button"
                  onClick={() => { setDurationMinutes(null); setDurationDays(30); }}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-bold border transition-all ${
                    durationMinutes === null && durationDays === 30
                      ? 'bg-[#33650E] text-[#FFFFFF] border-[#33650E]'
                      : 'bg-[#F2F7EB] text-[#42493b] border-[#DFE5D8] hover:bg-[#ebefe4]'
                  }`}
                >
                  30 Days
                </button>
              </div>

              {!durationMinutes && (
                <>
                  <input
                    type="range"
                    aria-label="Access duration in days"
                    min="1"
                    max="90"
                    value={durationDays}
                    onChange={e => setDurationDays(Number(e.target.value))}
                    className="w-full accent-[#33650E]"
                  />
                  <div className="flex justify-between text-[11px] text-[#667065] mt-1">
                    <span>1 day</span>
                    <span>30 days (standard)</span>
                    <span>90 days (max)</span>
                  </div>
                </>
              )}
            </div>

            <div className="pt-4 border-t border-[#DFE5D8] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalGrant(null)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-[#484D45] hover:bg-[#F4F5F1]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={saving || selectedCategories.length === 0}
                className="bg-[#33650E] hover:bg-[#28510B] text-[#FFFFFF] text-[13px] font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md"
              >
                {saving ? 'Granting access…' : 'Sign & Grant Access'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* QR Code Presentation Modal for 2-Device Demo */}
      {qrGrant && (
        <Modal isOpen onClose={() => setQrGrant(null)} title="Share handoff link" maxWidth="md">
          <div className="space-y-5 text-center">
            <div className="flex items-center justify-between pb-3 border-b border-[#DFE5D8]">
              <div className="text-left">
                <span className="text-[11px] font-bold text-[#33650E] uppercase bg-[#F2F7EB] px-2.5 py-0.5 rounded-full border border-[#DFE5D8]">
                  Authenticated clinical handoff
                </span>
                <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[#0B0808] mt-1">
                  Scan to Open Handoff
                </h3>
              </div>
            </div>

            <p className="text-[13px] text-[#42493b] text-left">
              The assigned doctor can scan this code and sign in to view approved records.
            </p>

            {/* QR Code Graphic using dynamic SVG API */}
            <div className="p-4 bg-[#F7FBF0] rounded-2xl border-2 border-[#78A541] flex flex-col items-center justify-center space-y-3">
              <div className="w-48 h-48 flex items-center justify-center bg-white rounded-xl shadow-inner border border-[#DFE5D8] overflow-hidden shrink-0">
                <HandoffQr url={`${window.location.origin}/clinic/handoff/${qrGrant.id}`} />
              </div>
              <div className="text-left w-full space-y-1 font-mono text-[11px] bg-white p-2.5 rounded-xl border border-[#DFE5D8]">
                <p className="text-[#0B0808]"><strong>Grant ID:</strong> {qrGrant.id}</p>
                <p className="text-[#33650E]"><strong>Authorized Scopes:</strong> {qrGrant.approvedCategories.join(', ')}</p>
                <p className="text-[#667065]"><strong>Recipient:</strong> {qrGrant.requesterName} ({qrGrant.requestingOrgName})</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(`${window.location.origin}/clinic/handoff/${qrGrant.id}`);
                    setCopied(true);
                  } catch { setCopied(false); }
                }}
                className="flex-1 bg-[#33650E] hover:bg-[#28510B] text-white text-[13px] font-semibold py-2.5 px-4 rounded-xl shadow-md transition-all"
              >
                {copied ? 'Link copied' : 'Copy doctor link'}
              </button>
              <button
                onClick={() => setQrGrant(null)}
                className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-[#484D45] hover:bg-[#F4F5F1]"
              >
                Done
              </button>
            </div>
            <input readOnly aria-label="Doctor handoff link" value={`${window.location.origin}/clinic/handoff/${qrGrant.id}`} onFocus={event => event.currentTarget.select()} className="w-full rounded-xl border border-[#DFE5D8] p-3 text-xs text-[#42493b]" />
          </div>
        </Modal>
      )}
    </div>
  );
};
