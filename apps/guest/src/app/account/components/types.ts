export type TabId =
  | "profile"
  | "wallet"
  | "payments"
  | "invite"
  | "contact"
  | "rate"
  | "faqs"
  | "terms"
  | "privacy";

export interface FaqItem {
  qEn: string;
  qAr: string;
  aEn: string;
  aAr: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    qEn: "How do I book and confirm a reservation on QafNest?",
    qAr: "كيف أقوم بالحجز والتأكد من تأكيده عبر قاف نست؟",
    aEn: "Select your city, stay dates, and verified unit, then complete electronic checkout using Mada, Apple Pay, Visa, Mastercard, STC Pay, or Tabby/Tamara where enabled. Once paid, your booking appears immediately in 'My Bookings' with full directions and your ZATCA tax invoice.",
    aAr: "اختر المدينة وتواريخ الإقامة والوحدة المناسبة، ثم أتمم السداد الإلكتروني عبر مدى أو أبل باي أو فيزا أو ماستركارد أو STC Pay أو خيارات التقسيط المتاحة. وبمجرد الدفع يتأكد الحجز فوراً في 'حجوزاتي' متضمناً موقع العقار والفاتورة الضريبية.",
  },
  {
    qEn: "When, how, and to whom is the security deposit paid and refunded?",
    qAr: "متى ولمن يُدفع مبلغ التأمين وكيف يتم استرداده؟",
    aEn: "Where a Host specifies a security deposit on the listing page, it is paid directly to the Host upon arrival prior to check-in. The Host inspects the property at checkout and refunds the deposit in full provided the unit is left in sound condition under house rules.",
    aAr: "عند اشتراط مبلغ تأمين في صفحة الوحدة، يُدفع مباشرة للمضيف عند الوصول وقبل تسليم العقار، ويلتزم المضيف بفحص الوحدة عند المغادرة وإعادة كامل مبلغ التأمين فوراً ما لم توجد أضرار أو مخالفات.",
  },
  {
    qEn: "Are all listings licensed by the Saudi Ministry of Tourism?",
    qAr: "هل جميع الوحدات مرخصة رسمياً من وزارة السياحة السعودية؟",
    aEn: "Yes. QafNest operates as an authorized hospitality marketplace licensed by the Saudi Ministry of Tourism (License #73102999), requiring verified ownership or sublease authorization alongside national identity checks.",
    aAr: "نعم. تعمل قاف نست كمنصة ضيافة مرخصة من وزارة السياحة السعودية (ترخيص رقم 73102999)، مع اشتراط تراخيص الوحدات ومستندات التفويض والتحقق النظامي من الهوية.",
  },
  {
    qEn: "How do I get check-in instructions, Smart Lock PINs, or contact the Host?",
    qAr: "كيف أحصل على تعليمات الدخول ورمز القفل الذكي والتواصل مع المضيف؟",
    aEn: "Once confirmed, open your reservation in 'My Bookings' to see property coordinates, check-in/out times, Host contact options, and your manual Smart Lock PIN (when offered). If arriving late, notify the Host directly beforehand.",
    aAr: "بعد تأكيد الحجز، افتح تفاصيله في 'حجوزاتي' لعرض موقع العقار ومواعيد الدخول والخروج وبيانات التواصل مع المضيف ورمز القفل الذكي (إن وجد). يرجى إبلاغ المضيف مسبقاً حال التأخر عن موعد الوصول.",
  },
  {
    qEn: "Can I cancel or postpone my booking, and is it refundable?",
    qAr: "هل يمكنني إلغاء الحجز أو تأجيله، وهل يُسترد المبلغ المدفوع؟",
    aEn: "The reservation cannot be cancelled or postponed. Once payment is completed on QafNest, bookings are strictly final and non-refundable (0%). Exceptional verified Host unavailability cases are handled by QafNest Operations.",
    aAr: "لا يمكن إلغاء الحجز أو تأجيله. بمجرد إتمام الدفع يصبح الحجز نهائياً وغير قابل للاسترداد (٠٪)، ولا تُعالج إلا الحالات النادرة الموثقة لتعذر تسليم الوحدة من المضيف عبر فريق العمليات.",
  },
];

