"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Script from "next/script";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { useApp } from "@/context/AppContext";
import { usePublicCmsWorkspace } from "@/lib/cms/usePublicCmsWorkspace";
import {
  PhoneCall,
  MessageCircle,
  Mail,
  MapPin,
  Send,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Copy,
  Check,
  Loader2,
  ShieldCheck,
} from "lucide-react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: (error?: unknown) => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "flexible";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

// Official QafNest support contact coordinates
const OFFICIAL_PHONE_DISPLAY = "+966 57 670 7709";
const OFFICIAL_WHATSAPP_DISPLAY = "+966 57 670 7709";
const OFFICIAL_WHATSAPP_BASE = "https://wa.me/966576707709";
const OFFICIAL_SUPPORT_EMAIL = "support@qafnest.com";
const OFFICIAL_INFO_EMAIL = "info@qafnest.com";

export default function ContactUsPage() {
  const { language } = useApp();
  const label = (en: string, ar: string) => (language === "ar" ? ar : en);
  const { workspace: cmsWorkspace } = usePublicCmsWorkspace();

  const cmsContact = cmsWorkspace?.globals?.contactUs;

  const displayPhone =
    cmsContact?.phone?.trim() && !cmsContact.phone.includes("500000000")
      ? cmsContact.phone.trim()
      : OFFICIAL_PHONE_DISPLAY;
  const telHref = `tel:${displayPhone.replace(/[^\d+]/g, "")}`;

  const rawWhatsapp = cmsContact?.whatsapp?.trim();
  const whatsappDisplay =
    rawWhatsapp && !rawWhatsapp.includes("500000000")
      ? rawWhatsapp
      : OFFICIAL_WHATSAPP_DISPLAY;
  const whatsappBase =
    rawWhatsapp && !rawWhatsapp.includes("500000000")
      ? (rawWhatsapp.startsWith("http") ? rawWhatsapp : `https://wa.me/${rawWhatsapp.replace(/\D/g, "")}`)
      : OFFICIAL_WHATSAPP_BASE;

  const supportEmail = cmsContact?.supportEmail?.trim() || OFFICIAL_SUPPORT_EMAIL;
  const generalEmail = cmsContact?.generalEmail?.trim() || OFFICIAL_INFO_EMAIL;
  const addressText = language === "ar"
    ? (cmsContact?.address?.ar?.trim() || "الرياض وجدة، المملكة العربية السعودية")
    : (cmsContact?.address?.en?.trim() || "Riyadh & Jeddah Hubs, Kingdom of Saudi Arabia");

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [turnstileLoaded, setTurnstileLoaded] = useState<boolean>(false);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("booking");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedTicket, setCopiedTicket] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.turnstile) {
      setTurnstileLoaded(true);
    }
  }, []);

  const renderTurnstile = useCallback(() => {
    if (!siteKey || !turnstileContainerRef.current || !window.turnstile) return;
    try {
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
      turnstileContainerRef.current.innerHTML = "";
      const id = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          setTurnstileToken(token);
          setSubmitError(null);
        },
        "expired-callback": () => {
          setTurnstileToken("");
        },
        "error-callback": () => {
          setTurnstileToken("");
        },
        theme: "auto",
        size: "normal",
      });
      widgetIdRef.current = id;
    } catch (e) {
      console.warn("Turnstile render error", e);
    }
  }, [siteKey]);

  useEffect(() => {
    if (turnstileLoaded && !submitted) {
      renderTurnstile();
    }
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch {}
      }
    };
  }, [turnstileLoaded, submitted, renderTurnstile]);

  const handleCopyTicket = () => {
    if (!ticketNumber) return;
    navigator.clipboard.writeText(ticketNumber);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) return;

    if (siteKey && !turnstileToken) {
      setSubmitError(
        label(
          "Please complete the security check before sending.",
          "يرجى إكمال فحص التحقق الأمني قبل الإرسال."
        )
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          subject,
          message: message.trim(),
          source: "contact_page",
          locale: language === "ar" ? "ar" : "en",
          turnstileToken: turnstileToken || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
            label("Failed to send your message. Please try again.", "تعذر إرسال رسالتك. يرجى المحاولة مرة أخرى.")
        );
      }
      setTicketNumber(data.ticketNumber || null);
      setSubmittedEmail(email.trim());
      setSubmitted(true);
    } catch (err: unknown) {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch {}
        setTurnstileToken("");
      }
      setSubmitError(
        err instanceof Error
          ? err.message
          : label("Network error while sending message.", "حدث خطأ في الشبكة أثناء الإرسال.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappWithTicketHref = ticketNumber
    ? `${whatsappBase}?text=${encodeURIComponent(
        language === "ar"
          ? `مرحباً فريق قاف نست، بخصوص التذكرة #${ticketNumber}`
          : `Hello QafNest Support, regarding ticket #${ticketNumber}`
      )}`
    : whatsappBase;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0A10] text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Simple, Clean Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {label("Contact Us", "تواصل معنا")}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
            {label(
              "Have questions about a reservation, check-in, or property listing? Reach out to our team.",
              "نسعد بخدمتكم والإجابة على استفساراتكم المتعلقة بالحجوزات، الدخول الذكي، أو تسجيل العقارات."
            )}
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Contact Channels */}
          <div className="md:col-span-5 space-y-4">
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#14121D] p-5 sm:p-6 shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {label("Direct Contacts", "قنوات التواصل")}
              </h2>

              {/* Phone Helpline */}
              <a
                href={telHref}
                className="flex items-center gap-3.5 p-3 rounded-lg border border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 transition group"
              >
                <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    {label("Phone", "الهاتف الموحد")}
                  </span>
                  <p dir="ltr" className="text-sm font-semibold text-slate-900 dark:text-white">
                    {displayPhone}
                  </p>
                </div>
              </a>

              {/* WhatsApp Support */}
              <a
                href={whatsappBase}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3.5 p-3 rounded-lg border border-slate-100 dark:border-white/5 hover:border-emerald-300 dark:hover:border-emerald-600/30 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 transition group"
              >
                <div className="w-8 h-8 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    {label("WhatsApp", "واتساب")}
                  </span>
                  <p dir="ltr" className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    {whatsappDisplay}
                  </p>
                </div>
              </a>

              {/* Email Addresses */}
              <div className="p-3 rounded-lg border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] space-y-2 text-xs">
                <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{label("Email", "البريد الإلكتروني")}</span>
                </div>
                <div className="space-y-1.5 text-[11px] pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">{label("Support:", "الدعم:")}</span>
                    <a href={`mailto:${supportEmail}`} className="font-medium text-slate-900 dark:text-white hover:underline">
                      {supportEmail}
                    </a>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-white/5">
                    <span className="text-slate-500">{label("General:", "عام:")}</span>
                    <a href={`mailto:${generalEmail}`} className="font-medium text-slate-900 dark:text-white hover:underline">
                      {generalEmail}
                    </a>
                  </div>
                </div>
              </div>

              {/* Physical Office HQ */}
              <div className="p-3 rounded-lg border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] space-y-1 text-xs">
                <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{label("Headquarters", "المقر")}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed pt-1">
                  {addressText}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Inquiry Form or Ticket Card */}
          <div className="md:col-span-7">
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#14121D] p-5 sm:p-7 shadow-xs">
              {submitted ? (
                <div className="py-6 px-4 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800/40">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {label("Message Sent Successfully", "تم إرسال رسالتك بنجاح")}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {label(
                        "We have received your inquiry and will get back to you shortly.",
                        "تم استلام رسالتك وسنقوم بالرد عليك في أقرب وقت."
                      )}
                    </p>
                  </div>

                  {ticketNumber && (
                    <div className="max-w-xs mx-auto p-3.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center space-y-2">
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                        {label("Inquiry Ticket Number", "رقم التذكرة")}
                      </span>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-lg font-bold font-mono tracking-wider text-slate-900 dark:text-white">
                          #{ticketNumber}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyTicket}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/10 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition cursor-pointer"
                        >
                          {copiedTicket ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>{label("Copied", "تم النسخ")}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>{label("Copy", "نسخ")}</span>
                            </>
                          )}
                        </button>
                      </div>
                      {submittedEmail && (
                        <p className="text-[11px] text-slate-500">
                          {label("Email confirmation sent to: ", "تم إرسال تأكيد إلى: ")}
                          <span className="font-medium text-slate-700 dark:text-slate-300">{submittedEmail}</span>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <a
                      href={whatsappWithTicketHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{label("WhatsApp with Ticket", "متابعة عبر واتساب")}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setTicketNumber(null);
                        setMessage("");
                        setTurnstileToken("");
                      }}
                      className="px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition cursor-pointer"
                    >
                      {label("Send Another", "إرسال رسالة جديدة")}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {submitError && (
                    <div className="flex items-start gap-2 rounded-lg border border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-950/20 p-3 text-xs text-rose-700 dark:text-rose-300">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {label("Your Name *", "الاسم *")}
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={label("e.g. Rowful Hasan", "الاسم الكامل")}
                        className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {label("Phone Number *", "رقم الجوال *")}
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+966 5X XXX XXXX"
                        className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {label("Email Address", "البريد الإلكتروني")}
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {label("Topic", "الموضوع")}
                      </label>
                      <div className="relative">
                        <select
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="appearance-none w-full h-9 pl-3 pr-8 rtl:pl-8 rtl:pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
                        >
                          <option value="booking">{label("Booking or Smart Lock", "حجز أو الدخول الذكي")}</option>
                          <option value="refund">{label("Cancellation & Refund", "إلغاء واسترداد")}</option>
                          <option value="host">{label("Host Partnership", "شراكة مضيف")}</option>
                          <option value="general">{label("General Inquiry", "استفسار عام")}</option>
                        </select>
                        <ChevronDown
                          aria-hidden="true"
                          className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {label("Message *", "الرسالة *")}
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={label("How can we help?", "اكتب رسالتك هنا...")}
                      className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>

                  {siteKey && (
                    <div className="pt-2 flex flex-col items-start gap-1.5">
                      <div ref={turnstileContainerRef} className="min-h-[65px]" />
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>
                          {label(
                            "Protected by Cloudflare Turnstile bot detection.",
                            "محمي بتقنية كلاودفلير للتحقق الأمني من الروبوتات."
                          )}
                        </span>
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={submitting || (siteKey ? !turnstileToken : false)}
                      className="h-9 px-5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold flex items-center gap-2 disabled:opacity-50 transition cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{label("Sending...", "جاري الإرسال...")}</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>{label("Send Message", "إرسال")}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {siteKey && (
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="lazyOnload"
            onLoad={() => setTurnstileLoaded(true)}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
