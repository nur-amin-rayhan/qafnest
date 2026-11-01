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
    questionEn: "What is the QafNest platform and how is it licensed in Saudi Arabia?",
    questionAr: "ما هي منصة قف نست وكيف يتم ترخيصها في المملكة العربية السعودية؟",
    answerEn:
      "QafNest is an authorized peer-to-peer vacation rental and hospitality platform, officially licensed and supervised by the Saudi Ministry of Tourism (License No. 73102999). We directly connect travelers with verified chalets, private villas, heritage farms, and luxury glamping sanctuaries across the Kingdom with full consumer protection and guaranteed reservation security.",
    answerAr:
      "منصة قف نست هي منصة سعودية مرخصة رسمياً ومصرحة من وزارة السياحة (ترخيص رقم 73102999) لتأجير بيوت العطلات والإقامات الفاخرة. نربط الضيوف مباشرة بالشاليهات الموثقة، الفلل الخاصة، المزارع التراثية، والمخيمات الصحراوية مع ضمان وحماية كاملة للحجز.",
  },
  {
    questionEn: "How does Self Check-in with Digital Smart Locks work?",
    questionAr: "كيف يعمل الدخول الذاتي عبر الأقفال الرقمية الذكية؟",
    answerEn:
      'Properties with the "Self Check-in" badge offer 100% contactless access. Once your reservation is confirmed and your national ID (or Iqama/passport) is verified, an encrypted digital access PIN is generated in your QafNest App and sent to your WhatsApp. The PIN automatically activates at the scheduled check-in hour (typically 3:00 PM) for secure keyless entry.',
    answerAr:
      'العقارات التي تحمل شارة "دخول ذاتي" تتيح وصولاً بدون تلامس بنسبة 100%. بمجرد تأكيد حجزك والتحقق من الهوية الوطنية أو الإقامة، يتم إنشاء رمز سري مشفر للدخول في تطبيق قف نست وإرساله عبر الواتساب. يُفعل الرمز تلقائياً في موعد تسجيل الوصول (الساعة 3:00 مساءً عادةً).',
  },
  {
    questionEn: "Can I split my reservation payment in 4 installments with Tabby?",
    questionAr: "هل يمكنني تقسيط قيمة الحجز على 4 دفعات مع تابي؟",
    answerEn:
      "Yes! During checkout, select Tabby as your payment method. Your total booking amount will be divided into 4 equal monthly installments with 0% interest and 0 hidden fees. First installment is paid at booking confirmation, and the remaining 3 are automatically deducted monthly. All installments are Sharia-compliant and approved by SAMA.",
    answerAr:
      "نعم بكل تأكيد! اختر تابي عند إتمام الحجز وسيتم تقسيم المبلغ الإجمالي على 4 دفعات شهرية متساوية بدون أي فوائد أو رسوم خفية. متوافق مع الشريعة الإسلامية ومعتمد من البنك المركزي السعودي (ساما).",
  },
  {
    questionEn: "What is the cancellation, refund, and security deposit policy?",
    questionAr: "ما هي سياسة الإلغاء والاسترجاع ومبلغ التأمين؟",
    answerEn:
      "Each property listing displays its clear cancellation tier (Flexible, Moderate, or Strict). Eligible cancellations are refunded directly to your original card within 3–5 business days. For properties that require an on-site security deposit, the amount is held and automatically released upon check-out inspection, guaranteed under our Host-Guest Fair Resolution Policy.",
    answerAr:
      "يوضح كل إعلان عقاري سياسة الإلغاء بوضوح (مرنة، متوسطة، أو صارمة). في حال الإلغاء المستحق، يتم استرجاع المبلغ إلى نفس البطاقة خلال 3-5 أيام عمل. بالنسبة للتأمين، يتم حجزه وتفويضه تلقائياً بعد الفحص عند تسجيل المغادرة.",
  },
  {
    questionEn: "Can I host a large family banquet or celebration at a chalet or farm?",
    questionAr: "هل يمكن إقامة مناسبات أو تجمعات عائلية كبيرة في الشاليهات أو المزارع؟",
    answerEn:
      'Absolutely. Most of our chalets, villas, and farms are custom-architected for Saudi social culture, featuring separate expansive men’s and women’s majlis, outdoor barbecue facilities, children’s splash zones, and catering kitchens. Please check each property’s "Guest Capacity" spec on the booking card before finalizing your date.',
    answerAr:
      'بالتأكيد. تم تصميم معظم الشاليهات والفلل والمزارع خصيصاً لتناسب العائلات السعودية، وتضم مجالس واسعة منفصلة للرجال والنساء، مناطق شواء، وألعاب مائية للأطفال. يرجى التحقق من السعة القصوى المحددة في بطاقة كل عقار.',
  },
  {
    questionEn: "How do I list my property as a host and what are the earnings?",
    questionAr: "كيف أسجل عقاري كمضيف وما هي العوائد المتوقعة؟",
    answerEn:
      "Listing your chalet, farm, or villa takes only 2 minutes via our Host Portal. Hosts on QafNest earn between 18,000 SAR and 45,000 SAR monthly with our 1,000,000 SAR host property damage guarantee, automated calendar synchronization, and prompt bi-weekly direct bank transfers.",
    answerAr:
      "تسجيل شاليهك أو مزرعتك يستغرق دقيقتين فقط عبر بوابة المضيفين. يحقق المضيفون عوائد شهرية تتراوح بين 18,000 ر.س و45,000 ر.س، مع حماية للممتلكات تصل إلى 1,000,000 ر.س، وتزامن تلقائي للتقويم، وتحويلات بنكية مباشرة.",
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
