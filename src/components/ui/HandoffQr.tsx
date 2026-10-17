import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function HandoffQr({ url }: { url: string }) {
  const [source, setSource] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setSource('');
    setFailed(false);
    QRCode.toDataURL(url, { width: 256, margin: 2, errorCorrectionLevel: 'M' })
      .then(value => { if (active) setSource(value); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [url]);
  return source ? <img src={source} alt="QR code for the doctor handoff link" width={256} height={256} className="h-full w-full object-contain" /> : <p role="status" className="p-4 text-center text-xs text-[#667065]">{failed ? 'QR unavailable. Copy the link below instead.' : 'Preparing QR code…'}</p>;
}
