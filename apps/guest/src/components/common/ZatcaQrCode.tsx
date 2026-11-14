"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

interface ZatcaQrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function ZatcaQrCode({ value, size = 110, className = "" }: ZatcaQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    if (!value) return;
    let isMounted = true;

    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: {
        dark: "#1A1A2E",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (isMounted) setDataUrl(url);
      })
      .catch((err) => {
        console.warn("Notice: QR Code generation warning:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse"
      >
        <span className="text-[9px] font-mono text-gray-400">Loading QR...</span>
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt="ZATCA Verified Tax QR Code"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`rounded-xl object-contain bg-white shadow-xs p-1 border border-gray-200 dark:border-white/10 ${className}`}
    />
  );
}
