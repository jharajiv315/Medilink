import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import type { AuditEvent } from '../types/medilink.ts';

interface PatientAccessHistoryProps {
  onNavigate: (path: string) => void;
}

export const PatientAccessHistory: React.FC<PatientAccessHistoryProps> = ({ onNavigate }) => {
  const { getAuthHeaders } = useAuth();
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [filterAction, setFilterAction] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadAuditLogs = () => {
    fetch('/api/audit', {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        if (data.logs) {
          setLogs(data.logs);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filterAction === 'ALL') return true;
    return log.action === filterAction;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#DFE5D8]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2F7EB] text-[#33650E] text-[11px] font-bold border border-[#DFE5D8] mb-2">
            <span className="material-symbols-outlined text-[14px]">receipt_long</span>
            <span>Immutable Zero-Tamper Ledger</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-[28px] sm:text-[34px] font-bold text-[#0B0808]">
            Transparent Access &amp; Audit Trail
          </h1>
          <p className="font-['DM_Sans'] text-[15px] text-[#42493b] mt-1">
            Every clinical document import, access request, physician view, and revocation is
            cryptographically logged with tamper-evident provenance.
          </p>
        </div>

        <button
          onClick={loadAuditLogs}
          className="inline-flex items-center gap-2 bg-[#F2F7EB] hover:bg-[#ebefe4] text-[#33650E] border border-[#DFE5D8] text-[13px] font-semibold px-4 py-2.5 rounded-xl transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 items-center bg-[#FFFFFF] p-4 rounded-2xl border border-[#DFE5D8] shadow-sm">
        <span className="text-[12px] font-bold text-[#667065] mr-2">Filter Action:</span>
        {[
          { label: 'All Events', val: 'ALL' },
          { label: 'Record Accessed', val: 'RECORD_ACCESSED' },
          { label: 'Access Approved', val: 'ACCESS_APPROVED' },
          { label: 'Access Revoked', val: 'ACCESS_REVOKED' },
          { label: 'Access Denied', val: 'ACCESS_DENIED' },
          { label: 'Document Ingested', val: 'DOCUMENT_INGESTED' }
        ].map(filter => (
          <button
            key={filter.val}
            onClick={() => setFilterAction(filter.val)}
            className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all ${
              filterAction === filter.val
                ? 'bg-[#33650E] text-[#FFFFFF] shadow-sm'
                : 'bg-[#F2F7EB] text-[#42493b] hover:bg-[#ebefe4]'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#DFE5D8] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#667065]">Loading audit ledger...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-[#667065]">No audit events match this filter.</div>
        ) : (
          <div className="divide-y divide-[#F4F5F1]">
            {filteredLogs.map(log => {
              const isDenied = log.outcome === 'DENIED' || log.action === 'ACCESS_DENIED';
              const isRevoked = log.action === 'ACCESS_REVOKED';

              return (
                <div
                  key={log.id}
                  className={`p-5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isDenied
                      ? 'bg-[#FFF0EF]/40'
                      : isRevoked
                      ? 'bg-[#FFF5E5]/40'
                      : 'hover:bg-[#F2F7EB]/40'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isDenied
                          ? 'bg-[#FFF0EF] text-[#A33837]'
                          : isRevoked
                          ? 'bg-[#FFF5E5] text-[#985C12]'
                          : 'bg-[#F2F7EB] text-[#33650E]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isDenied
                          ? 'block'
                          : isRevoked
                          ? 'remove_moderator'
                          : log.action === 'RECORD_ACCESSED'
                          ? 'visibility'
                          : log.action === 'DOCUMENT_INGESTED'
                          ? 'upload_file'
                          : 'verified_user'}
                      </span>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-['Plus_Jakarta_Sans'] font-bold text-[14px] text-[#0B0808]">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            log.outcome === 'SUCCESS'
                              ? 'bg-[#F2F7EB] text-[#33650E]'
                              : 'bg-[#FFF0EF] text-[#A33837]'
                          }`}
                        >
                          {log.outcome}
                        </span>
                      </div>

                      <p className="text-[13px] text-[#0B0808] mt-1 leading-relaxed">
                        {log.details}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-[#667065]">
                        <span>
                          Actor: <strong>{log.actorName}</strong> ({log.actorRole})
                        </span>
                        <span>•</span>
                        <span>{log.organization}</span>
                        <span>•</span>
                        <span className="font-mono">{log.ipHash}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[12px] font-mono text-[#667065] block">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#72796a] font-mono block mt-0.5">
                      Event ID: {log.id}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-[#F2F7EB] p-4 rounded-xl border border-[#DFE5D8] flex items-center justify-between text-[12px] text-[#42493b]">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[#33650E] text-[16px]">verified</span>
          <span>Ledger is tamper-evident with cryptographic SHA-256 event chaining.</span>
        </span>
        <button
          onClick={() => onNavigate('/patient/dashboard')}
          className="text-[#33650E] font-bold hover:underline"
        >
          Return to Dashboard →
        </button>
      </div>
    </div>
  );
};
