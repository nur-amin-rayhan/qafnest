"use client";

import { X } from "lucide-react";
import type { RealtimeAlert } from "@/hooks/useHostRealtime";

interface HostRealtimeAlertsProps {
  alerts: RealtimeAlert[];
  lang: "ar" | "en";
  onDismiss: (id: string) => void;
}

export default function HostRealtimeAlerts({
  alerts,
  lang,
  onDismiss,
}: HostRealtimeAlertsProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 rtl:right-auto rtl:left-5 z-50 max-w-sm space-y-2 pointer-events-auto">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="rounded-2xl border border-violet-200 bg-white p-4 shadow-xl text-slate-900 flex items-start justify-between gap-3 animate-in slide-in-from-bottom-3"
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-black text-[#4F2396]">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{lang === "ar" ? alert.titleAr : alert.title}</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-600">
              {lang === "ar" ? alert.messageAr : alert.message}
            </p>
            <span className="text-[9px] font-bold text-slate-400">{alert.timestamp}</span>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(alert.id)}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
            aria-label="Dismiss alert"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

