import { PROPERTIES, type Property } from "@/data/properties";
import type { GuestReview, ReviewSummary } from "./types";

const reviewCopy = [
  {
    title: "A relaxing stay",
    comment: "The place was clean and exactly as described. Check-in was simple, and we had everything we needed for a comfortable stay.",
    titleAr: "إقامة مريحة",
    commentAr: "كان المكان نظيفاً ومطابقاً للوصف. كان تسجيل الوصول سهلاً، وتوفرت لنا كل احتياجات الإقامة المريحة.",
  },
  {
    title: "Great place for a short break",
    comment: "We enjoyed the quiet setting and thoughtful details. The host shared clear instructions before arrival.",
    titleAr: "مكان رائع للاستراحة",
    commentAr: "استمتعنا بالهدوء والتفاصيل الجميلة. أرسل المضيف تعليمات واضحة قبل الوصول.",
  },
  {
    title: "Comfortable and tidy",
    comment: "The rooms were tidy and the bed was comfortable. The listing photos matched what we found on arrival.",
    titleAr: "مريح ومرتب",
    commentAr: "كانت الغرف مرتبة والسرير مريحاً. الصور تطابقت مع ما وجدناه عند الوصول.",
  },
  {
    title: "Would stay here again",
    comment: "A smooth experience from arrival to checkout. The location worked well for our plans, and support was responsive.",
    titleAr: "سأكرر الإقامة هنا",
    commentAr: "كانت التجربة سهلة من الوصول حتى المغادرة. الموقع مناسب لخططنا وكان الدعم سريعاً.",
  },
  {
    title: "Good value and easy check-in",
    comment: "Self check-in was convenient and the property was well prepared. We had a pleasant stay overall.",
    titleAr: "قيمة جيدة ودخول سهل",
    commentAr: "كان الدخول الذاتي مريحاً وكان العقار جاهزاً بشكل جيد. كانت إقامتنا ممتعة عموماً.",
  },
  {
    title: "A few small things to improve",
    comment: "The stay was enjoyable and clean. A couple of small amenities could be refreshed, but the host was helpful.",
    titleAr: "بعض التفاصيل البسيطة للتحسين",
    commentAr: "كانت الإقامة ممتعة ونظيفة. يمكن تجديد بعض المرافق البسيطة، وكان المضيف متعاوناً.",
  },
  {
    title: "Peaceful and as expected",
    comment: "We appreciated the calm neighborhood and clear arrival information. Everything was ready when we checked in.",
    titleAr: "هادئ ومطابق للتوقعات",
    commentAr: "أعجبنا هدوء الحي ووضوح معلومات الوصول. كان كل شيء جاهزاً عند تسجيل الوصول.",
  },
  {
    title: "Nice details throughout",
    comment: "The property felt cared for and the amenities were useful. Communication was friendly and straightforward.",
    titleAr: "تفاصيل جميلة في المكان",
    commentAr: "شعرنا بالاهتمام بالمكان وكانت المرافق مفيدة. كان التواصل ودياً وواضحاً.",
  },
  {
    title: "Clean, comfortable, and convenient",
    comment: "Everything was in good order and the instructions were easy to follow. It made our weekend simple.",
    titleAr: "نظيف ومريح ومناسب",
    commentAr: "كان كل شيء مرتباً وكانت التعليمات سهلة. جعل ذلك عطلة نهاية الأسبوع مريحة.",
  },
  {
    title: "A pleasant first visit",
    comment: "We had a good first visit. The space was comfortable, and the listing details helped us plan ahead.",
    titleAr: "زيارة أولى ممتعة",
    commentAr: "كانت زيارتنا الأولى جيدة. المكان مريح وتفاصيل الإعلان ساعدتنا على التخطيط.",
  },
  {
    title: "A calm weekend",
    comment: "The neighborhood was peaceful, the property was ready on arrival, and the host answered our questions quickly.",
    titleAr: "عطلة نهاية أسبوع هادئة",
    commentAr: "كان الحي هادئاً وكان المكان جاهزاً عند الوصول، وأجاب المضيف عن أسئلتنا بسرعة.",
  },
  {
    title: "Thoughtful and comfortable",
    comment: "The space was comfortable and well organized. The check-in instructions were clear and easy to follow.",
    titleAr: "إقامة مريحة بعناية",
    commentAr: "كان المكان مريحاً ومنظماً جيداً. كانت تعليمات تسجيل الوصول واضحة وسهلة.",
  },
  {
    title: "A clean, easy stay",
    comment: "The property was clean and prepared for us. Communication before arrival made everything straightforward.",
    titleAr: "إقامة نظيفة وسهلة",
    commentAr: "كان العقار نظيفاً وجاهزاً لنا. جعل التواصل قبل الوصول كل شيء سهلاً.",
  },
  {
    title: "Comfortable for our plans",
    comment: "The location worked well for our trip and the space matched the listing. We had a relaxed stay.",
    titleAr: "مناسب لخططنا",
    commentAr: "كان الموقع مناسباً لرحلتنا وتطابق المكان مع الإعلان. كانت إقامتنا مريحة.",
  },
  {
    title: "Helpful host and clear details",
    comment: "The host was helpful and the property information was clear. We knew what to expect before arriving.",
    titleAr: "مضيف متعاون وتفاصيل واضحة",
    commentAr: "كان المضيف متعاوناً ومعلومات العقار واضحة. عرفنا ما نتوقعه قبل الوصول.",
  },
  {
    title: "A good place to unwind",
    comment: "We appreciated the tidy space and simple arrival process. It was a comfortable place to unwind.",
    titleAr: "مكان جيد للاسترخاء",
    commentAr: "أعجبنا ترتيب المكان وسهولة الوصول. كان مكاناً مريحاً للاسترخاء.",
  },
  {
    title: "Everything was ready",
    comment: "The amenities were useful and the instructions matched the property. Check-in and checkout went smoothly.",
    titleAr: "كل شيء كان جاهزاً",
    commentAr: "كانت المرافق مفيدة والتعليمات مطابقة للعقار. مر تسجيل الوصول والمغادرة بسلاسة.",
  },
  {
    title: "A welcoming experience",
    comment: "The property was comfortable and the host made the arrival easy. We would happily recommend it.",
    titleAr: "تجربة مرحبة",
    commentAr: "كان العقار مريحاً وسهّل المضيف الوصول. يسعدنا التوصية به.",
  },
  {
    title: "Quiet and well prepared",
    comment: "Everything was in good condition and the area was quiet. The stay matched what we expected.",
    titleAr: "هادئ وجاهز بشكل جيد",
    commentAr: "كان كل شيء بحالة جيدة وكانت المنطقة هادئة. طابقت الإقامة توقعاتنا.",
  },
];

const ratingCycle = [10, 9.5, 10, 8, 10, 9, 7.5, 10, 8.5, 9.5, 10, 9];
const hostReplies = [
  {
    en: "Thank you for staying with us. We are glad you had a comfortable visit and hope to welcome you again.",
    ar: "شكراً لإقامتكم معنا. يسعدنا أن زيارتكم كانت مريحة، ونتطلع لاستقبالكم مرة أخرى.",
  },
  {
    en: "We appreciate your kind feedback. It was a pleasure hosting you.",
    ar: "نقدّر كلماتكم الطيبة. سعدنا باستضافتكم.",
  },
  {
    en: "Thank you for sharing your experience. We are happy the stay worked well for your plans.",
    ar: "شكراً لمشاركة تجربتكم. يسعدنا أن الإقامة ناسبت خططكم.",
  },
  {
    en: "It was wonderful to host you. You are welcome back any time.",
    ar: "سعدنا باستضافتكم، ونرحب بعودتكم في أي وقت.",
  },
];

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function sampleCount(propertyId: string) {
  if (propertyId === "kidia-falcon-ridge") return 36;
  return [3, 6, 9, 12][stableHash(propertyId) % 4];
}

export function getSampleReviews(propertyId: string, property?: Property): GuestReview[] {
  const count = sampleCount(propertyId);
  const propertyName = property?.title || "this stay";

  return Array.from({ length: count }, (_, index) => {
    const copy = reviewCopy[(stableHash(`${propertyId}:${index}`) + index) % reviewCopy.length];
    const rating = ratingCycle[(stableHash(`${propertyId}:rating:${index}`) + index) % ratingCycle.length];
    const reviewDate = new Date(Date.UTC(2026, 9, 29 - index * 3));
    const date = reviewDate.toISOString();

    return {
      id: `sample-${propertyId}-${index + 1}`,
      property_id: propertyId,
      guest_display_name: `Demo guest ${String(index + 1).padStart(2, "0")}`,
      title: copy.title,
      comment: copy.comment.replace("the place", propertyName),
      title_ar: copy.titleAr,
      comment_ar: copy.commentAr,
      rating,
      cleanliness_rating: Math.max(1, rating),
      accuracy_rating: Math.max(1, rating - (index % 4 === 0 ? 0.5 : 0)),
      checkin_rating: Math.max(1, rating - (index % 5 === 0 ? 1 : 0)),
      value_rating: Math.max(1, rating - (index % 3 === 0 ? 0.5 : 0)),
      services_rating: Math.max(1, rating - (index % 5 === 0 ? 1 : 0)),
      property_state_rating: Math.max(1, rating - (index % 4 === 0 ? 0.5 : 0)),
      created_at: date,
      is_sample: true,
      is_verified_stay: false,
      admin_reply: index % 5 === 0 ? null : hostReplies[stableHash(`${propertyId}:reply:${index}`) % hostReplies.length].en,
      admin_reply_ar: index % 5 === 0 ? null : hostReplies[stableHash(`${propertyId}:reply:${index}`) % hostReplies.length].ar,
      admin_reply_by: index % 5 === 0 ? null : property?.host?.name || "QafNest host",
      admin_reply_at: index % 5 === 0 ? null : new Date(reviewDate.getTime() + 86_400_000).toISOString(),
    };
  });
}

export function summarizeReviews(reviews: GuestReview[]): ReviewSummary {
  const average = (values: Array<number | null | undefined>) => {
    const available = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    return available.length
      ? Math.round((available.reduce((sum, value) => sum + value, 0) / available.length) * 10) / 10
      : null;
  };

  return {
    total: reviews.length,
    average: average(reviews.map((review) => review.rating)) || 0,
    categoryAverages: {
      accuracy: average(reviews.map((review) => review.accuracy_rating)),
      cleanliness: average(reviews.map((review) => review.cleanliness_rating)),
      services: average(reviews.map((review) => review.services_rating)),
      propertyState: average(reviews.map((review) => review.property_state_rating)),
    },
  };
}

export function isDemoProperty(propertyId: string) {
  return PROPERTIES.some((property) => property.id === propertyId);
}
