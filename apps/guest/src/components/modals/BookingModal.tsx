"use client";

import { useState } from "react";
import { X, ShieldCheck, Zap, Check } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function BookingModal() {
  const {
    bookingModal,
    closeBookingModal,
    formatPrice,
    formatTabby,
    checkinDate,
    checkinTime,
    checkoutDate,
    checkoutTime,
    stayTiming,
    guestsCount,
    language,
  } = useApp();
  const [paymentOption, setPaymentOption] = useState<"full" | "split">("split");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!bookingModal.isOpen) return null;

  const getNights = () => {
    if (!checkinDate || !checkoutDate) return 2;
    const d1 = new Date(checkinDate);
    const d2 = new Date(checkoutDate);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  const nights = getNights();
  const totalStay = bookingModal.basePrice * nights;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      closeBookingModal();
      alert(
        language === "ar"
          ? `🌟 تم تأكيد الحجز الفوري لـ ${bookingModal.propertyTitle}!\nطريقة الدفع: ${
              paymentOption === "split"
                ? "تقسيط 4 دفعات عبر تابي"
                : "دفع كامل مباشر"
            }\nتم إرسال قسيمة الحجز ورمز القفل الذكي للدخول الذاتي عبر الرسائل القصيرة والواتساب إلى ${phone || "+966 5X XXX XXXX"}.`
          : `🌟 Instant Reservation Confirmed for ${bookingModal.propertyTitle}!\nPayment: ${
              paymentOption === "split"
                ? "Tabby 4-Month Installment"
                : "Full Direct Payment"
            }\nYour booking voucher and self check-in smart lock PIN have been dispatched via SMS & WhatsApp to ${phone || "+966 5X XXX XXXX"}.`
      );
    }, 800);
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-opacity duration-300"
      onClick={closeBookingModal}
    >
      <div
        className="glass-strong glow-border max-w-lg w-full rounded-3xl p-6 sm:p-8 relative shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeBookingModal}
          className="absolute top-5 right-5 rtl:right-auto rtl:left-5 h-8 w-8 rounded-full glass flex items-center justify-center text-muted hover:text-fg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] uppercase tracking-widest text-emerald-600 dark:text-emerald-300 font-bold glass px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />{" "}
            {language === "ar" ? "ترخيص معتمد" : "Verified License"}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-fuchsia-600 dark:text-fuchsia-400 font-bold glass px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Zap className="w-3 h-3 text-fuchsia-600 dark:text-fuchsia-400" />{" "}
            {language === "ar" ? "حجز فوري" : "Instant Book"}
          </span>
        </div>

        <h3 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {bookingModal.propertyTitle}
        </h3>
        <p className="text-xs text-gray-500 dark:text-muted/70 mb-5">
          {language === "ar"
            ? "محمي بضمان قف نست الشامل وتأمين الإقامة البديلة مجاناً."
            : "Protected by QafNest Host Guarantee & Free Relocation."}
        </p>

        {/* Price Breakdown */}
        <div className="glass rounded-2xl p-4 mb-5 border border-violet-100 dark:border-white/10 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-muted">{language === "ar" ? "السعر للّيلة:" : "Rate per night:"}</span>
            <span className="font-bold text-gray-900 dark:text-white">
              {formatPrice(bookingModal.basePrice)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-muted">{language === "ar" ? "مدة الإقامة:" : "Stay Duration:"}</span>
            <span className="font-bold text-gray-900 dark:text-white">
              {nights} {language === "ar" ? (nights === 1 ? "ليلة" : "ليالٍ") : (nights === 1 ? "Night" : "Nights")} ({checkinDate} {checkinTime} → {checkoutDate} {checkoutTime})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-muted">{language === "ar" ? "الضيوف والتوقيت:" : "Guests & Timing:"}</span>
            <span className="font-bold text-gray-900 dark:text-white">
              {guestsCount} {language === "ar" ? "ضيوف" : "Guests"} · {stayTiming === "evening_shift" ? (language === "ar" ? "فترة مسائية" : "Evening Shift") : stayTiming === "morning_shift" ? (language === "ar" ? "فترة صباحية" : "Morning Shift") : stayTiming === "flexible_smart" ? (language === "ar" ? "قفل ذكي ٢٤ ساعة" : "24h Smart Lock") : (language === "ar" ? "يوم كامل" : "Full Day")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-muted">{language === "ar" ? "رسوم التنظيف والخدمة:" : "Cleaning & Service Fee:"}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{language === "ar" ? "مجاناً (مشمولة)" : "FREE (Covered)"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-muted">{language === "ar" ? "الضرائب ورسوم السياحة:" : "Taxes & Ministry VAT:"}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{language === "ar" ? "مشمولة" : "Included"}</span>
          </div>
          <div className="pt-2 border-t border-gray-200 dark:border-white/10 flex justify-between items-baseline">
            <span className="font-bold text-sm text-gray-900 dark:text-white">{language === "ar" ? "المبلغ الإجمالي:" : "Total Amount:"}</span>
            <span className="font-display text-xl font-bold text-gradient">
              {formatPrice(totalStay)}
            </span>
          </div>
        </div>

        {/* Payment Plan Selector */}
        <div className="mb-5">
          <span className="text-xs font-semibold text-violet-700 dark:text-violet-300 block mb-2">
            {language === "ar" ? "اختر طريقة الدفع:" : "Select Payment Method:"}
          </span>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`glass rounded-2xl p-3 border cursor-pointer transition-all flex flex-col justify-between ${
                paymentOption === "full"
                  ? "border-violet-500 bg-violet-600/15"
                  : "border-gray-200 dark:border-white/10 hover:border-violet-400/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  {language === "ar" ? "دفع كامل المبلغ" : "Pay in Full"}
                </span>
                <input
                  type="radio"
                  name="payment-modal-opt"
                  checked={paymentOption === "full"}
                  onChange={() => setPaymentOption("full")}
                  className="accent-fuchsia-500"
                />
              </div>
              <span className="text-[10px] text-gray-500 dark:text-muted/70">
                {language === "ar" ? "مدى، آبل باي، فيزا" : "Mada, Apple Pay, Visa"}
              </span>
            </label>

            <label
              className={`glass rounded-2xl p-3 border cursor-pointer transition-all flex flex-col justify-between ${
                paymentOption === "split"
                  ? "border-violet-500 bg-violet-600/15"
                  : "border-gray-200 dark:border-white/10 hover:border-violet-400/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-fuchsia-600 dark:text-fuchsia-300">
                  {language === "ar" ? "تقسيط تابي" : "Tabby Split"}
                </span>
                <input
                  type="radio"
                  name="payment-modal-opt"
                  checked={paymentOption === "split"}
                  onChange={() => setPaymentOption("split")}
                  className="accent-fuchsia-500"
                />
              </div>
              <span className="text-[10px] text-violet-600 dark:text-violet-300 font-semibold">
                {formatTabby(totalStay)}
              </span>
            </label>
          </div>
        </div>

        {/* Guest Input Fields */}
        <form onSubmit={handleConfirm} className="space-y-3">
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={language === "ar" ? "الاسم الكامل (حسب الهوية / جواز السفر)" : "Full Name (As per National ID / Passport)"}
            className="w-full rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-violet-500"
          />
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={language === "ar" ? "رقم الجوال (05X XXX XXXX)" : "Mobile Number (+966 / WhatsApp)"}
            className="w-full rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-violet-500"
          />

          <button
            type="submit"
            disabled={isSuccess}
            className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all mt-4 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>
              {isSuccess
                ? (language === "ar" ? "جاري معالجة الحجز..." : "Processing Reservation...")
                : (language === "ar" ? "تأكيد الحجز الفوري" : "Confirm Instant Reservation")}
            </span>
            <Check className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
