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
  const referralCode = `QAF-${userId ? userId.slice(0, 6).toUpperCase() : "AMIN26"}`;

  return (
    <div>
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {t("Invite Friends & Earn Rewards", "دعوة الأصدقاء ومكافآت المحفظة")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t(
              "Share your code: Give 50 SAR to your friends and get 50 SAR into your wallet.",
              "شارك كود الدعوة: امنح أصدقاءك خصم ٥٠ ر.س واحصل على ٥٠ ر.س في محفظتك."
            )}
          </p>
        </div>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 mb-6">
        <div className="text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#4F2396] text-[#FF9750] mx-auto flex items-center justify-center mb-4">
            <Users size={28} />
          </div>

          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-2">
            {t("Your Exclusive Referral Code", "كود الدعوة الحصري الخاص بك")}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            {t(
              "When your friend completes their first stay, 50 SAR is credited automatically.",
              "عند إتمام صديقك لحجزه الأول، تُودع ٥٠ ر.س فوراً في رصيد محفظتك."
            )}
          </p>

          {/* Copy Box */}
          <div className="flex items-center gap-2 p-2 rounded-2xl bg-white dark:bg-[#06060B] border border-purple-200 dark:border-white/10 shadow-xs mb-4">
            <span
              className="flex-1 font-mono font-black text-lg text-[#4F2396] dark:text-[#FF9750] tracking-wider text-center"
              dir="ltr"
            >
              {referralCode}
            </span>
            <button
              type="button"
              onClick={handleCopyInviteCode}
              className="px-4 py-2.5 rounded-xl bg-[#4F2396] hover:bg-[#3f1c79] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              {copiedCode ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedCode ? t("Copied!", "تم النسخ!") : t("Copy Code", "نسخ الكود")}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyInviteLink}
            className="text-xs font-bold text-[#4F2396] dark:text-purple-300 hover:underline cursor-pointer"
          >
            {copiedLink
              ? t("Link copied!", "تم نسخ الرابط!")
              : t("Copy Shareable Link", "نسخ رابط المشاركة المباشر")}
          </button>
        </div>
      </div>
    </div>
  );
}

