"use client";

import React from "react";
import { Users, Check, Copy } from "lucide-react";

interface InviteFriendsTabProps {
  userId?: string;
  copiedCode: boolean;
  copiedLink: boolean;
  handleCopyInviteCode: () => void;
  handleCopyInviteLink: () => void;
  t: (en: string, ar: string) => string;
}

export default function InviteFriendsTab({
  userId,
  copiedCode,
  copiedLink,
  handleCopyInviteCode,
  handleCopyInviteLink,
  t,
}: InviteFriendsTabProps) {
  const referralCode = `QAF-${userId ? userId.slice(0, 6).toUpperCase() : "GUEST"}`;

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-slate-200 dark:border-white/[0.08]">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
          {t("Invite Friends", "دعوة الأصدقاء")}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          {t(
            "Share your referral code with friends to earn wallet credit when they complete a stay.",
            "شارك رمز الدعوة مع أصدقائك للحصول على رصيد في المحفظة عند إتمام إقامتهم الأولى."
          )}
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-[#F9F8FD] dark:bg-white/[0.03] border border-slate-200 dark:border-white/10">
        <div className="text-center max-w-md mx-auto">
          <div className="w-11 h-11 rounded-xl bg-[#F4EEFF] text-[#4F2396] dark:bg-[#4F2396]/25 dark:text-purple-200 mx-auto flex items-center justify-center mb-4">
            <Users size={20} strokeWidth={1.75} />
          </div>

          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
            {t("Your referral code", "رمز الدعوة الخاص بك")}
          </h3>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-[#06060B] border border-slate-300 dark:border-white/15 mb-4">
            <span
              className="flex-1 font-mono font-semibold text-base text-[#4F2396] dark:text-purple-300 text-center tabular-nums"
              dir="ltr"
            >
              {referralCode}
            </span>
            <button
              type="button"
              onClick={handleCopyInviteCode}
              className="px-4 py-2 rounded-lg bg-[#4F2396] hover:bg-[#3f1c79] text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedCode ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedCode ? t("Copied", "تم النسخ") : t("Copy code", "نسخ الرمز")}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyInviteLink}
            className="text-xs font-semibold text-[#4F2396] dark:text-purple-300 hover:underline cursor-pointer"
          >
            {copiedLink
              ? t("Link copied", "تم نسخ الرابط")
              : t("Copy shareable link", "نسخ رابط الدعوة")}
          </button>
        </div>
      </div>
    </div>
  );
}
