"use client";

import React from "react";
import { Bell } from "lucide-react";
import { HostNotification } from "../HostTopNav";

interface HostNotificationsDropdownProps {
  notifications: HostNotification[];
  notificationsOpen: boolean;
  setNotificationsOpen: (val: boolean) => void;
  onSelectNotification?: (notification: HostNotification) => void;
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
    onSelectNotification,
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
        className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 hover:bg-violet-50 dark:hover:bg-purple-950/40 hover:border-violet-200 dark:hover:border-purple-800/60 hover:text-[#4F2396] dark:hover:text-purple-300 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
        title={t("Notifications", "الإشعارات")}
        aria-label={t("Notifications", "الإشعارات")}
      >
        <Bell size={18} />
        {notifications.some((n) => !n.is_read) && (
          <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
        )}
      </button>

      {notificationsOpen && (
        <div
          className={`absolute top-12 z-50 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121324] p-4 shadow-2xl ${
            lang === "ar" ? "left-0" : "right-0"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {t("Notifications", "الإشعارات والتنبيهات")}
            </h3>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onMarkAllNotificationsRead}
                className="text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
              >
                {t("Mark all as read", "تحديد الكل كمقروء")}
              </button>
            )}
          </div>

          <div className="mt-3 max-h-80 overflow-y-auto space-y-2.5">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs font-bold text-slate-400 dark:text-slate-500">
                {t("No notifications yet", "لا توجد إشعارات جديدة حالياً")}
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(false);
                    onSelectNotification?.(notif);
                  }}
                  className={`w-full text-start rounded-xl p-3 text-xs transition cursor-pointer ${
                    notif.is_read
                      ? "bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400"
                      : "bg-violet-50/80 dark:bg-violet-950/30 hover:bg-violet-100/80 dark:hover:bg-violet-950/50 border border-violet-100 dark:border-violet-900/50 text-slate-900 dark:text-slate-100 font-extrabold"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      {!notif.is_read && (
                        <span className="h-2 w-2 rounded-full bg-violet-600 dark:bg-violet-400 shrink-0" />
                      )}
                      <span>{notif.title}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium line-clamp-2">
                    {notif.body}
                  </p>
                  <span className="mt-1.5 inline-block text-[10px] font-extrabold text-violet-600 dark:text-violet-400">
                    {t("Click to view details ->", "اضغط لعرض التفاصيل ←")}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
});

