"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { useApp } from "@/context/AppContext";
import { PhoneCall, MessageCircle, Mail, MapPin, Send, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
import { QAFNEST_SUPPORT_CONTACT, type CmsPageRecord } from "@qafnest/shared";

function toTelHref(raw: string): string {
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (!cleaned) return QAFNEST_SUPPORT_CONTACT.telHref;
  if (cleaned.startsWith("+")) return `tel:${cleaned}`;
  if (cleaned.startsWith("05") && cleaned.length === 10) return `tel:+966${cleaned.slice(1)}`;
  return `tel:${cleaned}`;
}

function toWhatsappHref(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return QAFNEST_SUPPORT_CONTACT.whatsappHref;
  const normalized = digits.startsWith("05") && digits.length === 10
    ? `966${digits.slice(1)}`
    : digits.startsWith("00")
    ? digits.slice(2)
    : digits;
  return `https://wa.me/${normalized}`;
}

export default function ContactUsPage() {
  const { language } = useApp();
  const label = (en: string, ar: string) => (language === "ar" ? ar : en);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("booking");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [cmsPage, setCmsPage] = useState<CmsPageRecord | null>(null);

  useEffect(() => {
    fetch("/api/cms/pages?id=contact")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.titleEn) setCmsPage(data);
      })
      .catch(() => {});
  }, []);

  const contactInfo = cmsPage?.contactInfo;
  const phoneDisplay = contactInfo?.phone?.trim() || QAFNEST_SUPPORT_CONTACT.displayPhone;
  const whatsappDisplay = contactInfo?.whatsapp?.trim() || phoneDisplay;
  const contactEmail = (() => {
    const raw = contactInfo?.supportEmail?.trim();
    if (!raw || raw.toLowerCase() === "support@qafnest.com") {
      return "qafnest@gmail.com";
    }
    return raw;
  })();
  const hqAddress = language === "ar"
    ? contactInfo?.addressAr?.trim() || QAFNEST_SUPPORT_CONTACT.hqAddressAr
    : contactInfo?.addressEn?.trim() || QAFNEST_SUPPORT_CONTACT.hqAddressEn;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) return;
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
      setSubmitted(true);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : label("Network error while sending message.", "حدث خطأ في الشبكة أثناء الإرسال.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFE] dark:bg-[#08070D] text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Header Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-[#4F2396] via-[#3B1973] to-[#250F4C] text-white p-8 sm:p-12 mb-10 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-xs mb-3">
              <PhoneCall className="w-3.5 h-3.5 text-violet-200" />
              {label("24/7 Customer Care & Helpline", "خدمة العملاء والدعم على مدار الساعة")}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {language === "ar"
                ? cmsPage?.titleAr || "تواصل مع فريق قاف نست"
                : cmsPage?.titleEn || "Get in Touch with QafNest"}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-violet-100 leading-relaxed">
              {language === "ar"
                ? cmsPage?.subtitleAr ||
                  "فريق الدعم الفني وخدمة العملاء جاهز لمساعدتك في أي استفسار حول حجزك، الدخول الذكي، تسجيل عقارك، أو متابعة المدفوعات والاسترداد."
                : cmsPage?.subtitleEn ||
                  "Need assistance with a reservation, smart lock access, host partnership, or refund tracking? Our Saudi support team is available 24/7 to help you."}
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-8 items-start">
          {/* Left Column: Official Contact Channels & HQ */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#12101a] p-6 sm:p-8 shadow-xs space-y-6">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {label("Direct Assistance Channels", "قنوات التواصل المباشر")}
              </h2>

              {/* Helpline Call */}
              <a
                href={toTelHref(phoneDisplay)}
                className="flex items-start gap-4 p-4 rounded-2xl border border-violet-100 dark:border-violet-500/20 bg-violet-50/50 dark:bg-violet-950/20 hover:border-violet-300 transition group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-[#4F2396] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {label("24/7 Phone Helpline", "الهاتف الموحد (24 ساعة)")}
                  </h3>
                  <p dir="ltr" className="text-base font-black text-slate-900 dark:text-white mt-0.5 group-hover:text-[#4F2396]">
                    {phoneDisplay}
                  </p>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
                    {label("Immediate response for active stays", "استجابة فورية للنزلاء والحجوزات النشطة")}
                  </span>
                </div>
              </a>

              {/* WhatsApp Support */}
              <a
                href={toWhatsappHref(whatsappDisplay)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-300 transition group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {label("Official WhatsApp Business", "واتساب الأعمال المعتمد")}
                  </h3>
                  <p dir="ltr" className="text-base font-black text-slate-900 dark:text-white mt-0.5 group-hover:text-emerald-700">
                    {whatsappDisplay}
                  </p>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    {label("Send photos, location queries, and transfer receipts", "إرسال الإيصالات والاستفسارات السريعة")}
                  </span>
                </div>
              </a>

              {/* Email Department */}
              <div className="p-4 rounded-2xl border border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <Mail className="w-4 h-4 text-violet-600" />
                  <span>{label("Email Departments", "البريد الإلكتروني للأقسام")}</span>
                </div>
                <div className="space-y-1 text-slate-600 dark:text-slate-400">
                  <p>
                    <strong>{label("Official Support & Inquiries: ", "البريد الرسمي للدعم والاستفسارات: ")}</strong>
                    <a href={`mailto:${contactEmail}`} className="text-violet-600 hover:underline font-medium">
                      {contactEmail}
                    </a>
                  </p>
                </div>
              </div>

              {/* Physical Office HQ */}
              <div className="p-4 rounded-2xl border border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <MapPin className="w-4 h-4 text-violet-600" />
                  <span>{label("Kingdom Headquarters", "المقر الرئيسي في المملكة")}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {hqAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Inquiry Form */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#12101a] p-6 sm:p-10 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {label("Send an Inquiry or Feedback", "أرسل رسالة أو استفساراً")}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {label("We respond to all general inquiries within 2 hours during business operations.", "نلتزم بالرد على جميع الرسائل خلال ساعتين كحد أقصى.")}
              </p>
            </div>

            {submitted ? (
              <div className="p-8 text-center space-y-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-500/20">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                  {label("Message Received Successfully!", "تم استلام رسالتك بنجاح!")}
                </h3>
                {ticketNumber && (
                  <p className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300">
                    {label("Ticket Reference:", "رقم التذكرة:")} #{ticketNumber}
                  </p>
                )}
                <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-sm mx-auto">
                  {label(
                    "Our support desk has received your ticket. A representative will contact you via phone or email shortly.",
                    "تم توجيه رسالتك إلى قسم الدعم المختص وسيقوم أحد ممثلينا بالتواصل معك عبر الهاتف أو البريد قريباً."
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setTicketNumber(null);
                    setMessage("");
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-white text-emerald-800 text-xs font-bold border border-emerald-200 hover:bg-emerald-50 cursor-pointer"
                >
                  {label("Send Another Message", "إرسال رسالة أخرى")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {submitError && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {label("Your Full Name *", "الاسم الكامل *")}
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={label("e.g. Abdullah Al-Otaibi", "مثال: عبدالله العتيبي")}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {label("Saudi Mobile Phone *", "رقم الجوال السعودي *")}
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+966 5X XXX XXXX"
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {label("Email Address", "البريد الإلكتروني")}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="block w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {label("Subject Category", "نوع الاستفسار")}
                    </label>
                    <div className="relative">
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="block appearance-none w-full h-10 pl-3 pr-9 rtl:pl-9 rtl:pr-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs leading-normal text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                      >
                        <option value="booking">{label("Existing Booking or Smart Lock", "حجز حالي أو الدخول الذكي")}</option>
                        <option value="refund">{label("Cancellation & Refund Inquiry", "استفسار عن الإلغاء والاسترداد")}</option>
                        <option value="host">{label("Host Partnership / List Property", "تسجيل عقار / شراكة مضيف")}</option>
                        <option value="general">{label("General Inquiries & Suggestions", "استفسارات عامة أو اقتراحات")}</option>
                      </select>
                      <ChevronDown
                        aria-hidden="true"
                        className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {label("Your Message *", "تفاصيل الرسالة *")}
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={label("Please describe your question or requirement in detail...", "اكتب تفاصيل طلبك أو استفسارك هنا...")}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-11 px-6 rounded-xl bg-[#4F2396] hover:bg-[#3d1a78] text-white text-xs font-bold shadow-xs flex items-center gap-2 disabled:opacity-50 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? label("Sending Message...", "جاري الإرسال...") : label("Submit Message", "إرسال الرسالة")}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
