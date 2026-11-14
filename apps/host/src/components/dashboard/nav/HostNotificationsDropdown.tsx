"use client";

import React from "react";
import { Bell } from "lucide-react";
import { HostNotification } from "../HostTopNav";

interface HostNotificationsDropdownProps {
  notifications: HostNotification[];
  notificationsOpen: boolean;
  setNotificationsOpen: (val: boolean) => void;
  onMarkAllNotificationsRead: () => Promise<void>;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export const HostNotificationsDropdown = React.forwardRef<
  HTMLDivElement,
  HostNotificationsDropdownProps
>(function HostNotificationsDropdown(
  {
    notifications,
    notificationsOpen,
    setNotificationsOpen,
    onMarkAllNotificationsRead,
    lang,
    t,
  },
  ref
) {
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setNotificationsOpen(!notificationsOpen)}
        className="relative grid h-10 w-10 place-items-center rounded-xl bg-[#dcd4ef] text-[#4F2396] hover:bg-[#ceC2e8] transition cursor-pointer"
        title={t("Notifications", "الإشعارات")}
      >
        <Bell size={18} />
        {notifications.some((n) => !n.is_read) && (
          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
        )}
      </button>

      {notificationsOpen && (
        <div
          className={`absolute top-12 z-50 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl ${
            lang === "ar" ? "left-0" : "right-0"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900">
              {t("Notifications", "الإشعارات والتنبيهات")}
            </h3>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onMarkAllNotificationsRead}
                className="text-[11px] font-bold text-[#4F2396] hover:underline cursor-pointer"
              >
                {t("Mark all as read", "تحديد الكل كمقروء")}
              </button>
            )}
          </div>

          <div className="mt-3 max-h-80 overflow-y-auto space-y-2.5">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs font-bold text-slate-400">
                {t("No notifications yet", "لا توجد إشعارات جديدة حالياً")}
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`rounded-xl p-3 text-xs transition ${
                    notif.is_read
                      ? "bg-slate-50 text-slate-600"
                      : "bg-violet-50/80 border border-violet-100 text-slate-900 font-extrabold"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-black text-[#4F2396]">{notif.title}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-700 leading-relaxed font-medium">
                    {notif.body}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
});

