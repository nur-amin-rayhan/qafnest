"use client";

import React from "react";
import { QAFNEST_SUPPORT_CONTACT } from "@qafnest/shared";
import {
  MessageCircle,
  Phone,
  ArrowUpRight,
  CheckCircle2,
  Send,
} from "lucide-react";

interface ContactSupportTabProps {
  contactMessage: string;
  setContactMessage: (msg: string) => void;
  contactSent: boolean;
  handleSendContact: (e: React.FormEvent) => void;
  t: (en: string, ar: string) => string;
}

export default function ContactSupportTab({
  contactMessage,
  setContactMessage,
  contactSent,
  handleSendContact,
  t,
}: ContactSupportTabProps) {
  return (
    <div>
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {t("Contact Guest Experience", "خدمة وتجربة الضيوف ٢٤/٧")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t(
              "Dedicated concierge available 24/7 throughout Saudi Arabia.",
              "فريق دعم مخصص لخدمتك طوال فترة إقامتك على مدار الساعة في جميع مناطق المملكة."
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* WhatsApp Direct */}
        <a
          href={QAFNEST_SUPPORT_CONTACT.whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-100/60 transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
              <MessageCircle size={22} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {t("WhatsApp Concierge", "محادثة واتساب الفورية")}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-mono" dir="ltr">
                {QAFNEST_SUPPORT_CONTACT.displayPhone} ({QAFNEST_SUPPORT_CONTACT.internationalDisplay})
              </p>
            </div>
          </div>
          <ArrowUpRight size={18} className="text-emerald-600 rtl:rotate-270" />
        </a>

        {/* Direct Phone */}
        <a
          href={QAFNEST_SUPPORT_CONTACT.telHref}
          className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 hover:bg-slate-100/60 transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#4F2396] text-white flex items-center justify-center">
              <Phone size={20} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {t("Hotline Support", "الاتصال المباشر")}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-mono" dir="ltr">
                {QAFNEST_SUPPORT_CONTACT.displayPhone} · 24/7
              </p>
            </div>
          </div>
          <ArrowUpRight size={18} className="text-[#4F2396] rtl:rotate-270" />
        </a>
      </div>

      {/* Instant In-App Message */}
      <form onSubmit={handleSendContact} className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          {t("Send a Direct Inquiry", "إرسال استفسار أو طلب مساعدة")}
        </h3>

        {contactSent && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{t("Your message has been sent to guest experience!", "تم إرسال رسالتك لخدمة الضيوف بنجاح!")}</span>
          </div>
        )}

        <textarea
          rows={4}
          required
          value={contactMessage}
          onChange={(e) => setContactMessage(e.target.value)}
          placeholder={t(
            "How can we assist you with your booking, check-in, or stay?",
            "كيف يمكننا مساعدتك بخصوص حجزك، الدخول الذكي، أو إقامتك؟"
          )}
          className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-[#4F2396] focus:bg-white dark:focus:bg-[#06060B] transition"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!contactMessage.trim()}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#4F2396] hover:bg-[#3f1c79] text-white font-bold px-6 py-2.5 text-xs sm:text-sm shadow-md transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none min-h-[44px]"
          >
            <Send size={15} />
            <span>{t("Send Message", "إرسال الرسالة")}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

