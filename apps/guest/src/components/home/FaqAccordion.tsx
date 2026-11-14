"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ChevronDown } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface LocalizedFaq {
  questionEn: string;
  questionAr: string;
  answerEn: string;
  answerAr: string;
}

const LOCALIZED_FAQS: LocalizedFaq[] = [
  {
    questionEn: "What is QafNest and how is it licensed in Saudi Arabia?",
    questionAr: "ما هي منصة قاف نست وكيف يتم ترخيصها في المملكة العربية السعودية؟",
    answerEn:
      "QafNest is a peer-to-peer vacation hospitality platform licensed by the Saudi Ministry of Tourism (License No. 73102999), connecting verified Guests with Hosts listing licensed chalets, private villas, resorts (istirahat), apartments, farms, and camps while ensuring secure payments and ZATCA tax compliance.",
    answerAr:
      "منصة قاف نست هي منصة إلكترونية سعودية مرخصة من وزارة السياحة (ترخيص رقم 73102999) تعمل كوسيط تقني يربط الضيوف مباشرة بالشاليهات الموثقة، الفلل الخاصة، الاستراحات، الشقق، المزارع، والمخيمات مع حماية المدفوعات والفوترة الضريبية المعتمدة.",
  },
  {
    questionEn: "How is a reservation confirmed, and how do I find the Host & location?",
    questionAr: "كيف يُؤكد الحجز، وكيف أعرف موقع العقار وأتواصل مع المضيف؟",
    answerEn:
      "Reservations are confirmed immediately upon completing electronic payment via Mada, Visa, Mastercard, Apple Pay, STC Pay, or Tabby/Tamara installments. Visit 'My Bookings' anytime to view booking confirmation, receipt/tax invoice, property directions, and Host contact options; please notify the Host directly if you will arrive later than check-in time.",
    answerAr:
      "يُؤكد الحجز نهائياً فور إتمام الدفع الإلكتروني عبر مدى أو فيزا أو ماستركارد أو أبل باي أو STC Pay أو خيارات التقسيط. انتقل إلى صفحة 'حجوزاتي' في أي وقت لاستعراض حالة الحجز والفاتورة الضريبية وموقع العقار والتواصل مع المضيف، مع ضرورة إبلاغ المضيف مسبقاً عند التأخر عن موعد الوصول.",
  },
  {
    questionEn: "When, how, and to whom is the security deposit paid and refunded?",
    questionAr: "متى ولمن يُدفع مبلغ التأمين وكيف يتم استرجاعه؟",
    answerEn:
      "If a unit specifies a security deposit, the exact amount is displayed on the listing page prior to checkout and paid directly on-site to the Host before entry. After check-out inspection confirming no damage or house-rule breach, the Host returns the full deposit to you.",
    answerAr:
      "في حال اشتراط مبلغ تأمين للوحدة، تظهر قيمته بوضوح قبل الدفع ويُدفع مباشرة للمضيف عند الوصول وقبل تسليم العقار. وعند المغادرة يقوم المضيف بفحص الوحدة وإعادة كامل مبلغ التأمين فور التأكد من سلامة الممتلكات.",
  },
  {
    questionEn: "How does Self Check-In with Digital Smart Locks work?",
    questionAr: "كيف يعمل الدخول الذاتي عبر الأقفال الرقمية الذكية؟",
    answerEn:
      'Properties displaying "Self Check-in" allow contactless arrival after your check-in time. Once confirmed, the Host manually sets your personal access PIN and displays it in your "My Bookings" portal prior to arrival.',
    answerAr:
      'العقارات التي تدعم "الدخول الذاتي" تتيح الوصول بدون مفاتيح بعد موعد الدخول المحدد. بمجرد تأكيد حجزك، يقوم المضيف بتعيين رمز القفل الذكي يدوياً ليظهر مباشرة في صفحة "حجوزاتي" قبل موعد الوصول.',
  },
  {
    questionEn: "Can a confirmed booking be cancelled, postponed, or refunded?",
    questionAr: "هل يمكن إلغاء الحجز أو تأجيله أو استرداد المبلغ؟",
    answerEn:
      "The reservation cannot be cancelled or postponed. Once payment is completed on QafNest, bookings are strictly final and non-refundable (0%). Please review stay dates, capacity, and host rules carefully prior to checkout.",
    answerAr:
      "لا يمكن إلغاء الحجز أو تأجيله. بمجرد إتمام دفع الحجز في قاف نست يصبح الحجز مؤكداً ونهائياً وغير قابل للاسترداد (٠٪)، لذا يُرجى مراجعة التواريخ وقواعد الوحدة بدقة قبل إتمام السداد.",
  },
  {
    questionEn: "How do Hosts list properties, get paid, and qualify for Host Protection?",
    questionAr: "كيف يسجل المضيف عقاره، ومتى تُحول المستحقات، وما هو برنامج حماية المضيف؟",
    answerEn:
      "Property owners or authorized sublessors can publish furnished, Tourism-licensed units in minutes through QafNest Host Portal with bilingual details and real photos. Net booking proceeds (after platform commission & VAT) transfer to the Host's verified Saudi IBAN within 24–48 hours of stay settlement, and confirmed stays qualify for Host Protection when direct damages are documented within 48 hours of checkout.",
    answerAr:
      "يمكن للمالك أو المستثمر المفوض تسجيل عقاره المفروش والمرخص من وزارة السياحة عبر بوابة المضيفين بصور واقعية وتفاصيل باللغتين. تُحول المستحقات الصافية بعد خصم عمولة المنصة إلى حساب الآيبان المعتمد خلال ٢٤ إلى ٤٨ ساعة من التسوية، كما يغطي برنامج حماية المضيف التلفيات المباشرة الموثقة خلال ٤٨ ساعة من المغادرة.",
  },
];

export default function FaqAccordion() {
  const { language, t } = useApp();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section id="faq" className="py-20 relative">
      <div className="max-w-4xl mx-auto px-5 sm:px-8">
        <div className="text-center max-w-xl mx-auto mb-14">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-300 mb-3 border border-violet-500/20 shadow-glow"
          >
            <HelpCircle className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            {t.faq.badge}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white"
          >
            {t.faq.title} <span className="text-gradient">{t.faq.titleHighlight}</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-3 text-sm text-gray-600 dark:text-muted/70 font-light"
          >
            {t.faq.sub}
          </motion.p>
        </div>

        {/* FAQ Accordion Items */}
        <div className="space-y-4">
          {LOCALIZED_FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            const question = language === "ar" ? faq.questionAr : faq.questionEn;
            const answer = language === "ar" ? faq.answerAr : faq.answerEn;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className={`glass glow-border rounded-2xl overflow-hidden transition-colors ${
                  isOpen ? "border-violet-400/40 shadow-glow" : ""
                }`}
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full p-5 sm:p-6 text-left rtl:text-right flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-display font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                    {question}
                  </span>
                  <div
                    className={`h-8 w-8 rounded-full glass flex items-center justify-center text-violet-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180 bg-luxe-gradient text-white shadow-glow" : ""
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 sm:px-6 pb-6 text-xs sm:text-sm text-gray-600 dark:text-muted/80 leading-relaxed border-t border-gray-100 dark:border-white/5 pt-4">
                        {answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
