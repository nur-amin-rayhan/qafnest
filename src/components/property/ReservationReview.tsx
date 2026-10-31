"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LockKeyhole,
  Mail,
  MessageCircle,
  MapPin,
  ShieldCheck,
  Smartphone,
  Star,
  Users,
  Wallet,
  LoaderCircle,
  X,
} from "lucide-react";
import AppModal from "@/components/modals/AppModal";
import AuthModal from "@/components/modals/AuthModal";
import HostModal from "@/components/modals/HostModal";
import SearchModal from "@/components/modals/SearchModal";
import Footer from "@/components/common/Footer";
import Navbar from "@/components/common/Navbar";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { getPropertyCapacity, Property } from "@/data/properties";
import { CATEGORY_NAMES_AR, CITY_NAMES_AR, PROPERTY_TITLES_AR } from "@/data/translations";
import { createClient } from "@/lib/supabase/client";
import { propertyDetailHref } from "@/lib/propertyUrls";

type ReservationReviewProps = { property: Property };
type PaymentMethod = "card" | "apple" | "tabby" | "tamara";
type OtpChannel = "sms" | "whatsapp";
type OtpStep = "code" | "profile";
const OTP_LENGTH = process.env.NEXT_PUBLIC_SUPABASE_OTP_LENGTH === "4" ? 4 : 6;

function normalizeSaudiPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("966")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return /^5\d{8}$/.test(digits) ? `+966${digits}` : null;
}

export default function ReservationReview({ property }: ReservationReviewProps) {
  const [supabase] = useState(() => createClient());
  const searchParams = useSearchParams();
  const searchParamString = searchParams.toString();
  const {
    language,
    formatPrice,
    checkinDate,
    setCheckinDate,
    checkinTime,
    setCheckinTime,
    checkoutDate,
    setCheckoutDate,
    checkoutTime,
    setCheckoutTime,
    guestsCount,
    setGuestsCount,
  } = useApp();
  const { user, profile, refreshProfile } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [splitMethodsOpen, setSplitMethodsOpen] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [showPriceDetails, setShowPriceDetails] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sentPhone, setSentPhone] = useState<string | null>(null);
  const [otpChannel, setOtpChannel] = useState<OtpChannel>("sms");
  const [sentChannel, setSentChannel] = useState<OtpChannel>("sms");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpStep, setOtpStep] = useState<OtpStep>("code");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [profileDetailsSaved, setProfileDetailsSaved] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSeconds, setOtpSeconds] = useState(0);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const otpInputRef = useRef<HTMLInputElement>(null);

  const label = (english: string, arabic: string) => language === "ar" ? arabic : english;
  const queryCheckinDate = searchParams.get("check_in");
  const queryCheckoutDate = searchParams.get("check_out");
  const queryCheckinTime = searchParams.get("check_in_time");
  const queryCheckoutTime = searchParams.get("check_out_time");
  const queryGuests = Number(searchParams.get("guests"));
  const bookingCheckinDate = queryCheckinDate || checkinDate;
  const bookingCheckoutDate = queryCheckoutDate || checkoutDate;
  const bookingCheckinTime = queryCheckinTime || checkinTime;
  const bookingCheckoutTime = queryCheckoutTime || checkoutTime;
  const bookingGuestsCount = Number.isInteger(queryGuests) && queryGuests > 0 ? queryGuests : guestsCount;
  const title = language === "ar"
    ? PROPERTY_TITLES_AR[property.id] || property.titleAr || property.title
    : property.title;
  const category = language === "ar"
    ? CATEGORY_NAMES_AR[property.category] || property.categoryName
    : property.categoryName;
  const city = language === "ar"
    ? CITY_NAMES_AR[property.city] || property.cityName
    : property.cityName;
  const location = language === "ar"
    ? property.districtAr || property.district || city
    : property.district || city;
  const capacity = getPropertyCapacity(property);
  const images = useMemo(
    () => property.images?.length ? property.images : [property.image],
    [property.image, property.images]
  );

  useEffect(() => {
    const params = new URLSearchParams(searchParamString);
    const checkin = params.get("check_in");
    const checkout = params.get("check_out");
    const checkinAt = params.get("check_in_time");
    const checkoutAt = params.get("check_out_time");
    const guests = Number(params.get("guests"));
    if (checkin) setCheckinDate(checkin);
    if (checkout) setCheckoutDate(checkout);
    if (checkinAt) setCheckinTime(checkinAt);
    if (checkoutAt) setCheckoutTime(checkoutAt);
    if (Number.isInteger(guests) && guests > 0) setGuestsCount(guests);
  }, [
    searchParamString,
    setCheckinDate,
    setCheckinTime,
    setCheckoutDate,
    setCheckoutTime,
    setGuestsCount,
  ]);

  useEffect(() => {
    if (otpSeconds <= 0) return;
    const timer = window.setTimeout(() => setOtpSeconds((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [otpSeconds]);

  useEffect(() => {
    if (otpModalOpen && otpStep === "code") {
      window.requestAnimationFrame(() => otpInputRef.current?.focus());
    }
  }, [otpModalOpen, otpStep]);

  useEffect(() => {
    if (!otpModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [otpModalOpen]);

  const nights = useMemo(() => {
    if (!bookingCheckinDate || !bookingCheckoutDate) return 1;
    const start = Date.parse(`${bookingCheckinDate}T00:00:00Z`);
    const end = Date.parse(`${bookingCheckoutDate}T00:00:00Z`);
    const duration = Math.ceil((end - start) / 86_400_000);
    return Number.isFinite(duration) && duration > 0 ? duration : 1;
  }, [bookingCheckinDate, bookingCheckoutDate]);

  const params = new URLSearchParams(searchParamString);
  params.set("check_in", bookingCheckinDate);
  params.set("check_out", bookingCheckoutDate);
  params.set("check_in_time", bookingCheckinTime);
  params.set("check_out_time", bookingCheckoutTime);
  params.set("guests", String(bookingGuestsCount));
  const editStayHref = propertyDetailHref(property.id, params);
  const total = property.basePrice * nights;
  const originalTotal = (property.originalPrice || property.basePrice) * nights;
  const hasDiscount = originalTotal > total;
  const installmentAmount = (total / 4).toLocaleString(language === "ar" ? "ar-SA" : "en-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const installmentPrice = `${installmentAmount} ${language === "ar" ? "ر.س" : "SAR"}`;
  const accountPhone = profile?.phone || user?.phone || (
    typeof user?.user_metadata?.phone === "string" ? user.user_metadata.phone : null
  );
  const userMetadata = user?.user_metadata || {};
  const metadataName = profile?.full_name?.trim() || (typeof userMetadata.full_name === "string" ? userMetadata.full_name.trim() : "");
  const metadataNameParts = metadataName.split(/\s+/).filter(Boolean);
  const savedFirstName = typeof userMetadata.first_name === "string" ? userMetadata.first_name.trim() : metadataNameParts[0] || "";
  const savedLastName = typeof userMetadata.last_name === "string" ? userMetadata.last_name.trim() : metadataNameParts.slice(1).join(" ");
  const savedEmail = typeof userMetadata.contact_email === "string" ? userMetadata.contact_email.trim() : user?.email || "";
  const profileDetailsComplete = profileDetailsSaved || Boolean(savedFirstName && savedLastName && savedEmail);
  const phoneOtpVerified = Boolean(user && (verifiedPhone || (accountPhone && user.phone_confirmed_at)));
  const phoneVerified = phoneOtpVerified && profileDetailsComplete;
  const reservationPhone = verifiedPhone || accountPhone;

  useEffect(() => {
    if (!phoneNumber && accountPhone?.startsWith("+966")) {
      setPhoneNumber(accountPhone.slice(4));
    }
  }, [accountPhone, phoneNumber]);

  const handleSendOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOtpError(null);
    setPaymentMessage(null);
    const formattedPhone = normalizeSaudiPhone(phoneNumber);
    if (!formattedPhone) {
      setOtpError(label("Enter a valid Saudi mobile number, for example 5X XXX XXXX.", "أدخل رقم جوال سعودي صالحاً، مثل 5X XXX XXXX."));
      return;
    }

    setOtpBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: { channel: otpChannel },
      });
      if (error) throw error;
      setSentPhone(formattedPhone);
      setSentChannel(otpChannel);
      setOtpSent(true);
      setOtpCode("");
      setOtpSeconds(60);
      setOtpStep("code");
      setOtpModalOpen(true);
      setOtpError(null);
    } catch (error) {
      setOtpError(error instanceof Error
        ? error.message
        : label("We couldn't send the code. Please try again.", "تعذر إرسال الرمز. حاول مرة أخرى."));
    } finally {
      setOtpBusy(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOtpError(null);
    if (!sentPhone || otpCode.length !== OTP_LENGTH) {
      setOtpError(label(`Enter the ${OTP_LENGTH}-digit code sent to your phone.`, `أدخل الرمز المكون من ${OTP_LENGTH} أرقام المرسل إلى هاتفك.`));
      return;
    }

    setOtpBusy(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: sentPhone,
        token: otpCode,
        type: "sms",
      });
      if (error) throw error;
      if (!data.user) throw new Error(label("Phone verification did not complete.", "لم يكتمل التحقق من الهاتف."));
      setVerifiedPhone(data.user.phone || sentPhone);
      setOtpSent(false);
      setOtpCode("");
      setOtpError(null);
      const metadata = data.user.user_metadata || {};
      const metadataFullName = typeof metadata.full_name === "string" ? metadata.full_name.trim() : "";
      const metadataNameParts = metadataFullName.split(/\s+/).filter(Boolean);
      const nextFirstName = typeof metadata.first_name === "string" ? metadata.first_name : metadataNameParts[0] || "";
      const nextLastName = typeof metadata.last_name === "string" ? metadata.last_name : metadataNameParts.slice(1).join(" ");
      const nextEmail = typeof metadata.contact_email === "string" ? metadata.contact_email : data.user.email || "";
      setFirstName(nextFirstName);
      setLastName(nextLastName);
      setContactEmail(nextEmail);
      if (nextFirstName.trim() && nextLastName.trim() && nextEmail.trim()) {
        setProfileDetailsSaved(true);
        setOtpModalOpen(false);
      } else {
        setOtpStep("profile");
        setOtpModalOpen(true);
      }
    } catch (error) {
      setOtpError(error instanceof Error
        ? error.message
        : label("That code could not be verified. Please try again.", "تعذر التحقق من الرمز. حاول مرة أخرى."));
    } finally {
      setOtpBusy(false);
    }
  };

  const handleResendOtp = async (channel: OtpChannel) => {
    if (!sentPhone || otpSeconds > 0 || otpBusy) return;
    setOtpError(null);
    setOtpBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: sentPhone,
        options: { channel },
      });
      if (error) throw error;
      setSentChannel(channel);
      setOtpSeconds(60);
      setOtpCode("");
    } catch (error) {
      setOtpError(error instanceof Error
        ? error.message
        : label("We couldn't resend the code. Please try again.", "تعذر إعادة إرسال الرمز. حاول مرة أخرى."));
    } finally {
      setOtpBusy(false);
    }
  };

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOtpError(null);
    if (!firstName.trim() || !lastName.trim() || !contactEmail.trim()) {
      setOtpError(label("Add your first name, last name and email.", "أدخل الاسم الأول واسم العائلة والبريد الإلكتروني."));
      return;
    }

    setOtpBusy(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const { data, error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: fullName,
          contact_email: contactEmail.trim().toLowerCase(),
        },
      });
      if (error) throw error;
      const profileUser = data.user || user;
      if (profileUser?.id) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ full_name: fullName, phone: verifiedPhone || sentPhone || accountPhone })
          .eq("id", profileUser.id);
        if (profileError) throw profileError;
      }
      setProfileDetailsSaved(true);
      await refreshProfile();
      setOtpModalOpen(false);
      setOtpStep("code");
      setOtpError(null);
    } catch (error) {
      setOtpError(error instanceof Error
        ? error.message
        : label("Your details could not be saved. Please try again.", "تعذر حفظ بياناتك. حاول مرة أخرى."));
    } finally {
      setOtpBusy(false);
    }
  };

  const handlePay = async () => {
    setPaymentMessage(null);
    if (!phoneVerified) {
      if (phoneOtpVerified) {
        setOtpStep("profile");
        setOtpModalOpen(true);
      } else {
        setOtpError(label("Verify your mobile number here before continuing.", "تحقق من رقم جوالك هنا قبل المتابعة."));
      }
      document.getElementById("phone-verification")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (paymentBusy) return;

    setPaymentBusy(true);
    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: paymentMethod,
          propertyId: property.id,
          checkIn: bookingCheckinDate,
          checkOut: bookingCheckoutDate,
          guests: bookingGuestsCount,
        }),
      });
      const result = await response.json() as { code?: string; provider?: string };

      if (!response.ok) {
        if (result.code === "phone_verification_required" || result.code === "profile_details_required") {
          setOtpStep(result.code === "profile_details_required" ? "profile" : "code");
          setOtpModalOpen(true);
        }
        const providerName = result.provider || (paymentMethod === "tabby" ? "Tabby" : paymentMethod === "tamara" ? "Tamara" : "card and Apple Pay");
        const errorMessage = result.code === "phone_verification_required"
          ? label("Your mobile verification session has expired. Verify your number again to continue.", "انتهت جلسة التحقق من رقم الجوال. تحقق من رقمك مرة أخرى للمتابعة.")
          : result.code === "profile_details_required"
            ? label("Please complete your name and email details to continue.", "أكمل الاسم والبريد الإلكتروني للمتابعة.")
            : result.code === "invalid_booking"
              ? label("Please review your dates and guest count before continuing.", "راجع تواريخ الإقامة وعدد الضيوف قبل المتابعة.")
              : result.code === "payment_provider_not_configured"
                ? `${providerName} is not configured yet. Your selection was routed correctly, and no charge was made.`
                : `${providerName} checkout is not available yet. No charge was made.`;
        setPaymentMessage(label(
          errorMessage,
          result.code === "phone_verification_required"
            ? "انتهت جلسة التحقق من رقم الجوال. تحقق من رقمك مرة أخرى للمتابعة."
            : result.code === "profile_details_required"
              ? "أكمل الاسم والبريد الإلكتروني للمتابعة."
              : result.code === "invalid_booking"
                ? "راجع تواريخ الإقامة وعدد الضيوف قبل المتابعة."
                : `${providerName} لم يتم إعداده بعد. تم توجيه طلب الدفع للطريقة الصحيحة ولم يتم خصم أي مبلغ.`
        ));
        return;
      }

      setPaymentMessage(label("The secure payment session is ready.", "جلسة الدفع الآمنة جاهزة."));
    } catch {
      setPaymentMessage(label("We could not reach the payment service. Please try again.", "تعذر الاتصال بخدمة الدفع. حاول مرة أخرى."));
    } finally {
      setPaymentBusy(false);
    }
  };

  const previousImage = () => setActiveImageIndex((index) => (index - 1 + images.length) % images.length);
  const nextImage = () => setActiveImageIndex((index) => (index + 1) % images.length);

  return (
    <div className="min-h-screen bg-white pb-16 text-gray-900 dark:bg-[#08070D] dark:text-gray-100">
      <Navbar />
      <main className="mx-auto max-w-[1240px] px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <Link
          href={editStayHref}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-violet-700 dark:text-gray-400 dark:hover:text-violet-300"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {label("Back to stay details", "العودة إلى تفاصيل الإقامة")}
        </Link>

        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div>
            <div className="mb-6">
              <span className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">
                {label("Reservation · Step 1", "الحجز · الخطوة ١")}
              </span>
              <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-gray-950 dark:text-white sm:text-4xl">
                {label("Review & Pay", "مراجعة الحجز والدفع")}
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {label("Review your stay and guest details before moving to payment.", "راجع تفاصيل الإقامة والضيوف قبل الانتقال إلى الدفع.")}
              </p>
            </div>

            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#12101a] sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-2xl bg-gray-100 sm:h-28 sm:w-40">
                  <Image src={property.image} alt={title} fill sizes="(max-width: 640px) 100vw, 160px" className="object-cover" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">{category}</span>
                  <h2 className="mt-1 text-lg font-bold text-gray-950 dark:text-white">{title}</h2>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1.5"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{property.rating.toFixed(1)} ({property.reviewsCount} {label("reviews", "تقييم")})</span>
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-violet-500" />{location}</span>
                    <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-violet-500" />{label("Up to", "حتى")} {capacity} {label("guests", "ضيوف")}</span>
                  </div>
                </div>
              </div>
            </section>

            <section id="phone-verification" className="mt-6 scroll-mt-28 rounded-3xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#12101a] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                    <ShieldCheck className="h-5 w-5" />
                    <h2 className="text-lg font-bold text-gray-950 dark:text-white">{label("Phone verification", "التحقق من الهاتف")}</h2>
                  </div>
                  {phoneVerified ? (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      {label("Verified phone", "الهاتف المتحقق منه")}: <strong dir="ltr" className="text-gray-900 dark:text-white">{reservationPhone}</strong>
                    </p>
                  ) : phoneOtpVerified ? (
                    <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600 dark:text-gray-400">
                      {label("Phone verified. Add your name and email to finish your guest profile.", "تم التحقق من الهاتف. أضف اسمك وبريدك الإلكتروني لإكمال ملف الضيف.")}
                    </p>
                  ) : (
                    <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600 dark:text-gray-400">
                      {label("Verify your mobile number here. You will stay on this reservation page.", "تحقق من رقم جوالك هنا، وستبقى في صفحة الحجز نفسها.")}
                    </p>
                  )}
                </div>
                {phoneOtpVerified ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />{label("Phone verified", "تم التحقق من الهاتف")}
                  </span>
                ) : null}
              </div>
              {!phoneVerified && (
                <div className="mt-5">
                  {phoneOtpVerified ? (
                    <button type="button" onClick={() => { setOtpStep("profile"); setOtpModalOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-xs font-bold text-white transition hover:bg-violet-800">
                      <Mail className="h-4 w-4" />{label("Add name and email", "أضف الاسم والبريد الإلكتروني")}
                    </button>
                  ) : (
                    <form onSubmit={handleSendOtp} className="space-y-3">
                      <label htmlFor="reservation-phone" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {label("Mobile number", "رقم الجوال")}
                      </label>
                      <div className="flex gap-2" dir="ltr">
                        <span className="flex shrink-0 items-center rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-gray-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-200">+966</span>
                        <input
                          id="reservation-phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel-national"
                          value={phoneNumber}
                          onChange={(event) => setPhoneNumber(event.target.value)}
                          placeholder="5X XXX XXXX"
                          maxLength={14}
                          className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-500 dark:border-white/10 dark:bg-[#0b0912] dark:text-white"
                          aria-label={label("Saudi mobile number", "رقم الجوال السعودي")}
                          required
                        />
                        <button type="submit" disabled={otpBusy} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-xs font-bold text-white transition hover:bg-violet-800 disabled:opacity-60">
                          {otpBusy && <LoaderCircle className="h-4 w-4 animate-spin" />}
                          {otpChannel === "sms" ? label("Send SMS code", "إرسال رمز SMS") : label("Send WhatsApp code", "إرسال رمز واتساب")}
                        </button>
                      </div>
                      <div>
                        <p className="mb-2 text-[11px] font-semibold text-gray-600 dark:text-gray-300">{label("Send verification code by", "أرسل رمز التحقق عبر")}</p>
                        <div className="grid grid-cols-2 gap-2 sm:max-w-sm" role="radiogroup" aria-label={label("Verification delivery channel", "قناة إرسال رمز التحقق")}>
                          <button type="button" role="radio" aria-checked={otpChannel === "sms"} onClick={() => setOtpChannel("sms")} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${otpChannel === "sms" ? "border-violet-500 bg-violet-50 text-violet-800 ring-1 ring-violet-500 dark:bg-violet-400/10 dark:text-violet-200" : "border-gray-200 text-gray-600 hover:border-violet-300 dark:border-white/10 dark:text-gray-300"}`}>
                            <Smartphone className="h-4 w-4" /> SMS
                          </button>
                          <button type="button" role="radio" aria-checked={otpChannel === "whatsapp"} onClick={() => setOtpChannel("whatsapp")} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${otpChannel === "whatsapp" ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500 dark:bg-emerald-400/10 dark:text-emerald-200" : "border-gray-200 text-gray-600 hover:border-emerald-300 dark:border-white/10 dark:text-gray-300"}`}>
                            <MessageCircle className="h-4 w-4" /> WhatsApp
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                  {otpSent && !phoneOtpVerified && (
                    <button type="button" onClick={() => { setOtpStep("code"); setOtpModalOpen(true); }} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-violet-200 px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-50 dark:border-violet-400/20 dark:text-violet-300 dark:hover:bg-violet-400/10">
                      {label("Continue with verification code", "تابع باستخدام رمز التحقق")}<ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                    </button>
                  )}
                  {otpError && <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{otpError}</p>}
                </div>
              )}
            </section>

            <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#12101a] sm:p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-violet-600 dark:text-violet-300" />
                <h2 className="text-lg font-bold text-gray-950 dark:text-white">{label("Booking policies and conditions", "سياسات وشروط الحجز")}</h2>
              </div>
              <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <p className="rounded-2xl bg-gray-50 p-4 dark:bg-white/[0.04]">
                  <strong className="block text-gray-900 dark:text-white">{label("Stay times", "أوقات الإقامة")}</strong>
                  <span className="mt-1 block">{label("Check-in", "تسجيل الوصول")} {bookingCheckinTime} · {label("Check-out", "تسجيل المغادرة")} {bookingCheckoutTime}</span>
                </p>
                <p className="text-xs leading-6 text-gray-500 dark:text-gray-400">
                  {label("Property-specific cancellation terms are not included in the current listing data and must be confirmed before payment.", "سيتم تأكيد شروط الإلغاء الخاصة بالعقار قبل الدفع، إذ لا تتوفر ضمن بيانات القائمة الحالية.")}
                </p>
              </div>
            </section>

            <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#12101a] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-950 dark:text-white">{label("Payment Methods", "طرق الدفع")}</h2>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{label("Choose how you want to pay. Your selection stays on this page.", "اختر طريقة الدفع، وسيبقى اختيارك في هذه الصفحة.")}</p>
                </div>
                <Wallet className="h-5 w-5 shrink-0 text-violet-600 dark:text-violet-300" />
              </div>

              {!phoneVerified && <p className="mt-4 rounded-xl bg-violet-50 px-3 py-2.5 text-xs leading-5 text-violet-800 dark:bg-violet-400/10 dark:text-violet-200">{label("Verify your mobile number and save your details to choose a payment method.", "تحقق من رقم جوالك واحفظ بياناتك لاختيار طريقة الدفع.")}</p>}

              <div role="radiogroup" aria-label={label("Payment method", "طريقة الدفع")} className={`mt-4 divide-y divide-gray-200 border-y border-gray-200 dark:divide-white/10 dark:border-white/10 ${!phoneVerified ? "opacity-60" : ""}`}>
                <PaymentRow
                  selected={paymentMethod === "apple"}
                  disabled={!phoneVerified}
                  onSelect={() => { setPaymentMethod("apple"); setPaymentMessage(null); }}
                  title="Apple Pay"
                  description={label("Pay securely with Apple Pay", "ادفع بأمان عبر Apple Pay")}
                  marks={<PaymentBrandLabel>Apple Pay</PaymentBrandLabel>}
                />
                <PaymentRow
                  selected={paymentMethod === "card"}
                  disabled={!phoneVerified}
                  onSelect={() => { setPaymentMethod("card"); setPaymentMessage(null); }}
                  title={label("Credit or debit card", "بطاقة مدى أو ائتمان")}
                  description={label("Card gateway · Mada, Visa and Mastercard", "بوابة البطاقات · مدى وVisa وMastercard")}
                  marks={<span className="text-right text-[10px] font-semibold text-gray-500 dark:text-gray-400">mada · Visa · Mastercard</span>}
                />
              </div>

              <div className="mt-1 border-b border-gray-200 dark:border-white/10">
                <button type="button" aria-expanded={splitMethodsOpen} onClick={() => setSplitMethodsOpen((open) => !open)} className="flex w-full items-center justify-between gap-3 py-4 text-left">
                  <span className="text-sm font-bold text-gray-950 dark:text-white">{label("Pay in Splits", "ادفع بالتقسيط")}</span>
                  <span className="flex items-center gap-3">
                    <PaymentBrandLabel>tabby</PaymentBrandLabel>
                    <TamaraBrandMark />
                    <ChevronRight className={`h-5 w-5 text-gray-600 transition-transform dark:text-gray-300 ${splitMethodsOpen ? "rotate-90" : ""}`} />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {splitMethodsOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div role="radiogroup" aria-label={label("Installment provider", "مزود التقسيط")} className="-mt-px divide-y divide-gray-200 border-t border-gray-200 dark:divide-white/10 dark:border-white/10">
                      <PaymentRow selected={paymentMethod === "tabby"} disabled={!phoneVerified} onSelect={() => { setPaymentMethod("tabby"); setPaymentMessage(null); }} title="Tabby" description={`${label("Pay in 4 installments", "ادفع على ٤ دفعات")} · 4 × ${installmentPrice}`} marks={<PaymentBrandLabel>tabby</PaymentBrandLabel>} />
                      <PaymentRow selected={paymentMethod === "tamara"} disabled={!phoneVerified} onSelect={() => { setPaymentMethod("tamara"); setPaymentMessage(null); }} title="Tamara" description={`${label("Split into 4 payments", "قسّم المبلغ على ٤ دفعات")} · 4 × ${installmentPrice}`} marks={<TamaraBrandMark />} />
                    </div>
                  </motion.div>}
                </AnimatePresence>
              </div>

              <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-gray-50 p-3 text-xs leading-5 text-gray-600 dark:bg-white/[0.04] dark:text-gray-300">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />
                <p>{label("Card and Apple Pay share the configured card gateway. Tabby and Tamara use separate providers. Card details are entered only in the provider's secure checkout.", "تستخدم البطاقة وApple Pay بوابة البطاقات نفسها. ولكل من تابي وتمارا مزود مستقل. لا تُدخل بيانات البطاقة إلا في صفحة الدفع الآمنة للمزود.")}</p>
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24">
            <section className="overflow-hidden rounded-3xl border border-violet-200 bg-white shadow-[0_18px_55px_rgba(70,35,130,0.12)] dark:border-violet-400/20 dark:bg-[#12101a] dark:shadow-[0_18px_55px_rgba(0,0,0,0.34)]">
              <div className="relative h-52 bg-gray-100">
                <Image src={images[activeImageIndex]} alt={`${title} ${activeImageIndex + 1}`} fill sizes="(max-width: 1024px) 100vw, 400px" className="object-cover transition duration-300" priority />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 pt-12 text-white">
                  <h2 className="line-clamp-1 font-bold">{title}</h2>
                  <p className="mt-1 text-xs text-white/80">{location}</p>
                </div>
                {images.length > 1 && (
                  <>
                    <button type="button" onClick={previousImage} aria-label={label("Previous property photo", "الصورة السابقة للعقار")} className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-lg backdrop-blur transition hover:bg-black/65">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button type="button" onClick={nextImage} aria-label={label("Next property photo", "الصورة التالية للعقار")} className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-lg backdrop-blur transition hover:bg-black/65">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <span className="absolute right-3 top-3 z-10 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur" aria-live="polite">{activeImageIndex + 1} / {images.length}</span>
                    <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5" role="group" aria-label={label("Property photos", "صور العقار")}>
                      {images.map((image, index) => (
                        <button key={`${image}-${index}`} type="button" onClick={() => setActiveImageIndex(index)} aria-label={`${label("Show photo", "عرض الصورة")} ${index + 1}`} aria-pressed={index === activeImageIndex} className={`h-1.5 rounded-full transition-all ${index === activeImageIndex ? "w-5 bg-white" : "w-1.5 bg-white/60 hover:bg-white"}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex items-baseline justify-between gap-3 border-b border-gray-100 pb-4 dark:border-white/10">
                  <div>
                    <span className="text-2xl font-extrabold text-gray-950 dark:text-white">{formatPrice(property.basePrice)}</span>
                    <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">/ {label("night", "ليلة")}</span>
                  </div>
                  {hasDiscount && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-600 dark:bg-rose-400/10 dark:text-rose-300">{property.discountPercentage || Math.round((1 - property.basePrice / (property.originalPrice || property.basePrice)) * 100)}% OFF</span>}
                </div>

                <div className="py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{nights} {label(nights === 1 ? "night" : "nights", "ليلة")}</span>
                    <button type="button" onClick={() => setShowPriceDetails((value) => !value)} className="text-xs font-semibold text-violet-700 hover:underline dark:text-violet-300" aria-expanded={showPriceDetails}>
                      {showPriceDetails ? label("Hide details", "إخفاء التفاصيل") : label("Show details", "عرض التفاصيل")}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10">
                    <div className="p-3">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400"><CalendarDays className="h-3 w-3 text-violet-500" />{label("Check-in", "الوصول")}</span>
                      <p className="mt-2 text-xs font-semibold text-gray-900 dark:text-white">{bookingCheckinDate}</p>
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400"><Clock3 className="h-3 w-3" />{bookingCheckinTime}</p>
                    </div>
                    <div className="border-l border-gray-200 p-3 dark:border-white/10">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400"><CalendarDays className="h-3 w-3 text-violet-500" />{label("Check-out", "المغادرة")}</span>
                      <p className="mt-2 text-xs font-semibold text-gray-900 dark:text-white">{bookingCheckoutDate}</p>
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400"><Clock3 className="h-3 w-3" />{bookingCheckoutTime}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-xl bg-gray-50 px-3.5 py-3 text-xs dark:bg-white/[0.04]">
                    <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><Users className="h-4 w-4 text-violet-500" />{label("Guests", "الضيوف")}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{bookingGuestsCount}</span>
                  </div>
                  <Link href={editStayHref} className="mt-3 inline-block text-xs font-semibold text-violet-700 hover:underline dark:text-violet-300">{label("Edit dates, times or guests", "تعديل التواريخ أو الأوقات أو الضيوف")}</Link>
                </div>

                {showPriceDetails && (
                  <div className="space-y-2 border-t border-gray-100 py-4 text-xs dark:border-white/10">
                    <div className="flex justify-between text-gray-600 dark:text-gray-300"><span>{formatPrice(property.basePrice)} × {nights} {label(nights === 1 ? "night" : "nights", "ليلة")}</span><span className="font-semibold text-gray-900 dark:text-white">{formatPrice(total)}</span></div>
                    {hasDiscount && <div className="flex justify-between text-emerald-700 dark:text-emerald-300"><span>{label("Stay discount", "خصم الإقامة")}</span><span>−{formatPrice(originalTotal - total)}</span></div>}
                    <div className="flex justify-between text-gray-600 dark:text-gray-300"><span>{label("Taxes and service fees", "الضرائب ورسوم الخدمة")}</span><span>{label("Included", "مشمولة")}</span></div>
                  </div>
                )}

                <div className="flex items-baseline justify-between border-t border-gray-100 pt-4 dark:border-white/10">
                  <span className="font-bold text-gray-900 dark:text-white">{label("Total", "الإجمالي")}</span>
                  <span className="text-xl font-extrabold text-gray-950 dark:text-white">{formatPrice(total)}</span>
                </div>
                <p className="mt-1 text-right text-[10px] text-gray-500 dark:text-gray-400">{label("Taxes included", "شامل الضرائب")}</p>

                <button type="button" onClick={handlePay} disabled={paymentBusy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-900/20 transition hover:bg-violet-800 disabled:cursor-wait disabled:opacity-70">
                  {paymentBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4 rtl:rotate-180" />}
                  {paymentBusy ? label("Connecting to payment service…", "جارٍ الاتصال بخدمة الدفع…") : phoneVerified ? label("Pay now", "ادفع الآن") : label("Verify phone to pay", "تحقق من الهاتف للدفع")}
                </button>
                <p className="mt-2 text-center text-[10px] leading-5 text-gray-500 dark:text-gray-400">{label("OTP and payment stay here. No charge is made until a secure gateway is connected.", "سيبقى التحقق والدفع هنا. لن يتم الخصم قبل ربط بوابة دفع آمنة.")}</p>
              </div>
            </section>
            {paymentMessage && (
              <div role="status" className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {paymentMessage}
              </div>
            )}
          </aside>
        </div>
      </main>
      <AnimatePresence>
        {otpModalOpen && (
          <motion.div
            className="fixed inset-0 z-[1200] flex items-center justify-center overflow-y-auto bg-gray-950/45 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => { if (event.target === event.currentTarget && !otpBusy) setOtpModalOpen(false); }}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="reservation-otp-title"
              className="relative w-full max-w-[520px] rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_30px_100px_rgba(20,12,40,0.28)] dark:border-white/10 dark:bg-[#12101a] sm:p-8"
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">
                    {otpStep === "code" ? label("Step 1 of 2 · Verify", "الخطوة ١ من ٢ · التحقق") : label("Step 2 of 2 · Your details", "الخطوة ٢ من ٢ · بياناتك")}
                  </span>
                  <h2 id="reservation-otp-title" className="mt-3 text-xl font-extrabold text-gray-950 dark:text-white">
                    {otpStep === "code" ? label("Verify phone number", "تحقق من رقم الهاتف") : label("Complete your profile", "أكمل ملفك الشخصي")}
                  </h2>
                </div>
                <button type="button" onClick={() => setOtpModalOpen(false)} disabled={otpBusy} aria-label={label("Close verification", "إغلاق التحقق")} className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 dark:hover:bg-white/10 dark:hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {otpStep === "code" ? (
                <form onSubmit={handleVerifyOtp} className="mt-6">
                  <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
                    {label(`Enter the ${OTP_LENGTH}-digit code sent by`, `أدخل الرمز المكون من ${OTP_LENGTH} أرقام المرسل عبر`)} <strong className="text-gray-900 dark:text-white">{sentChannel === "sms" ? "SMS" : "WhatsApp"}</strong> {label("to", "إلى")} <strong dir="ltr" className="whitespace-nowrap text-gray-900 dark:text-white">{sentPhone}</strong>
                  </p>
                  <div className="mx-auto mt-7 w-full max-w-[360px]" dir="ltr">
                    <label htmlFor="reservation-otp-code" className="sr-only">{label(`${OTP_LENGTH}-digit verification code`, `رمز التحقق المكون من ${OTP_LENGTH} أرقام`)}</label>
                    <div className="relative">
                      <input
                        ref={otpInputRef}
                        id="reservation-otp-code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        autoCapitalize="off"
                        spellCheck={false}
                        maxLength={OTP_LENGTH}
                        value={otpCode}
                        onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
                        className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
                        aria-label={label(`Enter the ${OTP_LENGTH}-digit SMS or WhatsApp code`, `أدخل رمز SMS أو واتساب المكون من ${OTP_LENGTH} أرقام`)}
                        required
                      />
                      <div aria-hidden="true" className="grid grid-cols-6 gap-2">
                        {Array.from({ length: OTP_LENGTH }, (_, index) => (
                          <span key={index} className={`flex h-14 items-center justify-center rounded-2xl border font-mono text-xl font-bold text-gray-950 transition dark:text-white sm:h-16 ${index === otpCode.length ? "border-violet-500 ring-2 ring-violet-100 dark:ring-violet-400/20" : otpCode[index] ? "border-violet-300 bg-violet-50 dark:border-violet-400/30 dark:bg-violet-400/10" : "border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.02]"}`}>
                            {otpCode[index] || (index === otpCode.length ? <span className="h-6 w-0.5 animate-pulse bg-violet-600" /> : "")}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{label("Didn't receive the message?", "لم تصلك الرسالة؟")}</span>
                    {otpSeconds > 0 && <span className="font-bold tabular-nums text-gray-800 dark:text-gray-200">({`00:${String(otpSeconds).padStart(2, "0")}`})</span>}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button type="button" onClick={() => handleResendOtp("sms")} disabled={otpBusy || otpSeconds > 0} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-3 text-xs font-bold text-gray-700 transition hover:border-violet-300 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:text-gray-200 dark:hover:bg-violet-400/10">
                      {otpBusy && sentChannel === "sms" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4 text-violet-600 dark:text-violet-300" />}
                      {label("Resend via SMS", "إعادة الإرسال عبر SMS")}
                    </button>
                    <button type="button" onClick={() => handleResendOtp("whatsapp")} disabled={otpBusy || otpSeconds > 0} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-3 text-xs font-bold text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:text-gray-200 dark:hover:bg-emerald-400/10">
                      {otpBusy && sentChannel === "whatsapp" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />}
                      {label("Resend via WhatsApp", "إعادة الإرسال عبر واتساب")}
                    </button>
                  </div>

                  {otpError && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{otpError}</p>}
                  <button type="submit" disabled={otpBusy || otpCode.length !== OTP_LENGTH} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-900/15 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50">
                    {otpBusy && <LoaderCircle className="h-4 w-4 animate-spin" />}{label("Verify phone", "تحقق من الهاتف")}
                  </button>
                  <button type="button" onClick={() => { setOtpModalOpen(false); setOtpSent(false); setOtpCode(""); setOtpError(null); }} className="mt-3 w-full text-center text-xs font-semibold text-violet-700 hover:underline dark:text-violet-300">{label("Change phone number", "تغيير رقم الهاتف")}</button>
                </form>
              ) : (
                <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                    <span className="flex items-center gap-2 font-bold"><CheckCircle2 className="h-4 w-4" />{label("Phone verified · You're signed in", "تم التحقق من الهاتف · تم تسجيل دخولك")}</span>
                    <p className="mt-1">{label("Your login stays on this booking page. Add your details for the reservation.", "سيبقى تسجيل دخولك في صفحة الحجز هذه. أضف بياناتك للحجز.")}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{label("First name", "الاسم الأول")}
                      <input autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} required className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-normal text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-500 dark:border-white/10 dark:bg-[#0b0912] dark:text-white" placeholder={label("First name", "الاسم الأول")} />
                    </label>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{label("Last name", "اسم العائلة")}
                      <input autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} required className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-normal text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-500 dark:border-white/10 dark:bg-[#0b0912] dark:text-white" placeholder={label("Last name", "اسم العائلة")} />
                    </label>
                  </div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">{label("Email address", "البريد الإلكتروني")}
                    <input type="email" autoComplete="email" inputMode="email" dir="ltr" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} required className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-normal text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-500 dark:border-white/10 dark:bg-[#0b0912] dark:text-white" placeholder="you@example.com" />
                  </label>
                  <p className="text-[11px] leading-5 text-gray-500 dark:text-gray-400">{label("Your verified phone remains your sign-in. This email is saved for booking updates.", "سيظل رقم هاتفك المتحقق منه وسيلة تسجيل الدخول. سنستخدم هذا البريد لتحديثات الحجز.")}</p>
                  {otpError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{otpError}</p>}
                  <button type="submit" disabled={otpBusy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-900/15 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50">
                    {otpBusy && <LoaderCircle className="h-4 w-4 animate-spin" />}{label("Save & continue to payment", "احفظ وتابع للدفع")}
                  </button>
                  {sentPhone && <button type="button" onClick={() => setOtpStep("code")} className="w-full text-center text-xs font-semibold text-violet-700 hover:underline dark:text-violet-300">{label("Back to verification code", "العودة إلى رمز التحقق")}</button>}
                </form>
              )}
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
      <Footer />
      <AuthModal />
      <HostModal />
      <AppModal />
      <SearchModal />
    </div>
  );
}

function PaymentRow({
  selected,
  disabled,
  onSelect,
  title,
  description,
  marks,
}: {
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  marks: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${title}. ${description}`}
      disabled={disabled}
      onClick={onSelect}
      className={`flex w-full items-center gap-3 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 disabled:cursor-not-allowed ${selected ? "text-gray-950 dark:text-white" : "text-gray-800 dark:text-gray-200"}`}
    >
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${selected ? "border-violet-700 dark:border-violet-300" : "border-gray-400 dark:border-gray-500"}`} aria-hidden="true">
        <span className={`h-2.5 w-2.5 rounded-full bg-violet-700 transition-transform dark:bg-violet-300 ${selected ? "scale-100" : "scale-0"}`} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-gray-500 dark:text-gray-400">{description}</span>
      </span>
      <span className="ml-3 flex shrink-0 items-center justify-end">{marks}</span>
    </button>
  );
}

function PaymentBrandLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{children}</span>;
}

function TamaraBrandMark() {
  return <Image src="https://cdn.tamara.co/assets/png/tamara-logo-badge-en.png" alt="Tamara" width={64} height={28} unoptimized className="h-7 w-16 object-contain" />;
}

