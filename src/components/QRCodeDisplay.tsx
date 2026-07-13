import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  userId: string;
  referralCode: string;
}

export function QRCodeDisplay({ userId, referralCode }: QRCodeDisplayProps) {
  const qrValue = JSON.stringify({
    type: 'enclave_invite',
    userId,
    referralCode,
  });

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl shadow-xl max-w-xs mx-auto">
      <div className="p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-center">
        <QRCodeSVG
          value={qrValue}
          size={180}
          level="H"
          includeMargin={true}
          fgColor="#111b21"
          bgColor="#ffffff"
        />
      </div>
      <p className="mt-4 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest text-center">
        Scan to add me on Enclave
      </p>
      <div className="mt-2 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
        <span className="text-[11px] font-mono font-black text-amber-500 uppercase tracking-widest">
          {referralCode}
        </span>
      </div>
    </div>
  );
}
