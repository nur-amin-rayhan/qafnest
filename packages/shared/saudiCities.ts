export interface SaudiCityDefinition {
  id: string;
  en: string;
  ar: string;
  regionEn: string;
  regionAr: string;
  lat: number;
  lng: number;
  aliases?: string[];
}

/**
 * Comprehensive catalog of Saudi Arabian cities & major governorates across all 13 regions.
 * Popular Tier-1 & tourism destinations appear first so dropdowns and search filters feel crisp.
 */
export const SAUDI_ALL_CITIES: SaudiCityDefinition[] = [
  // ─── Popular & Major Cities ──────────────────────────────────────────────
  { id: "riyadh", en: "Riyadh", ar: "الرياض", regionEn: "Riyadh Region", regionAr: "منطقة الرياض", lat: 24.7136, lng: 46.6753, aliases: ["ar riyadh", "الرياض"] },
  { id: "jeddah", en: "Jeddah", ar: "جدة", regionEn: "Makkah Region", regionAr: "منطقة مكة المكرمة", lat: 21.5433, lng: 39.1728, aliases: ["jiddah", "جدة", "جده"] },
  { id: "mecca", en: "Makkah", ar: "مكة المكرمة", regionEn: "Makkah Region", regionAr: "منطقة مكة المكرمة", lat: 21.3891, lng: 39.8579, aliases: ["makkah", "mecca", "مكة", "مكه", "مكة المكرمة"] },
  { id: "madinah", en: "Madinah", ar: "المدينة المنورة", regionEn: "Madinah Region", regionAr: "منطقة المدينة المنورة", lat: 24.5247, lng: 39.5692, aliases: ["medina", "madinah", "al madinah", "المدينة", "المدينه", "المدينة المنورة"] },
  { id: "dammam", en: "Dammam", ar: "الدمام", regionEn: "Eastern Province", regionAr: "المنطقة الشرقية", lat: 26.4207, lng: 50.0888, aliases: ["ad dammam", "الدمام"] },
  { id: "khobar", en: "Khobar", ar: "الخبر", regionEn: "Eastern Province", regionAr: "المنطقة الشرقية", lat: 26.2172, lng: 50.1971, aliases: ["al khobar", "al-khobar", "alkhobar", "الخبر"] },
  { id: "dhahran", en: "Dhahran", ar: "الظهران", regionEn: "Eastern Province", regionAr: "المنطقة الشرقية", lat: 26.2361, lng: 50.0393, aliases: ["az zahran", "الظهران"] },
  { id: "alula", en: "AlUla", ar: "العلا", regionEn: "Madinah Region", regionAr: "منطقة المدينة المنورة", lat: 26.6083, lng: 37.9222, aliases: ["al ula", "al-ula", "العلا"] },
  { id: "abha", en: "Abha", ar: "أبها", regionEn: "Asir Region", regionAr: "منطقة عسير", lat: 18.2164, lng: 42.5053, aliases: ["أبها", "ابها"] },
  { id: "taif", en: "Taif", ar: "الطائف", regionEn: "Makkah Region", regionAr: "منطقة مكة المكرمة", lat: 21.2854, lng: 40.4262, aliases: ["at taif", "al taif", "الطائف", "الطايف"] },
  { id: "alhafuf", en: "Al Ahsa & Hofuf", ar: "الأحساء والهفوف", regionEn: "Eastern Province", regionAr: "المنطقة الشرقية", lat: 25.38, lng: 49.5888, aliases: ["hofuf", "al hofuf", "al-hofuf", "ahsa", "al ahsa", "al-ahsa", "alahsa", "alhassa", "الهفوف", "الأحساء", "الاحساء"] },
  { id: "diriyah", en: "Diriyah", ar: "الدرعية", regionEn: "Riyadh Region", regionAr: "منطقة الرياض", lat: 24.7342, lng: 46.5726, aliases: ["ad diriyah", "al diriyah", "الدرعية", "الدرعيه"] },
  { id: "tabuk", en: "Tabuk", ar: "تبوك", regionEn: "Tabuk Region", regionAr: "منطقة تبوك", lat: 28.3835, lng: 36.5662, aliases: ["تبوك"] },
  { id: "buraidah", en: "Buraidah", ar: "بريدة", regionEn: "Al-Qassim Region", regionAr: "منطقة القصيم", lat: 26.326, lng: 43.975, aliases: ["buraydah", "بريدة", "بريده"] },
  { id: "jubail", en: "Jubail", ar: "الجبيل", regionEn: "Eastern Province", regionAr: "المنطقة الشرقية", lat: 27.0112, lng: 49.6583, aliases: ["al jubail", "الجبيل"] },
  { id: "yanbu", en: "Yanbu", ar: "ينبع", regionEn: "Madinah Region", regionAr: "منطقة المدينة المنورة", lat: 24.0232, lng: 38.19, aliases: ["ينبع"] },
  { id: "khamis", en: "Khamis Mushait", ar: "خميس مشيط", regionEn: "Asir Region", regionAr: "منطقة عسير", lat: 18.3, lng: 42.7333, aliases: ["khamis mushayt", "خميس مشيط"] },
  { id: "hail", en: "Ha'il", ar: "حائل", regionEn: "Ha'il Region", regionAr: "منطقة حائل", lat: 27.5114, lng: 41.7208, aliases: ["hail", "حائل", "حايل"] },
  { id: "najran", en: "Najran", ar: "نجران", regionEn: "Najran Region", regionAr: "منطقة نجران", lat: 17.5656, lng: 44.2289, aliases: ["نجران"] },
  { id: "jazan", en: "Jazan", ar: "جازان", regionEn: "Jazan Region", regionAr: "منطقة جازان", lat: 16.8894, lng: 42.5706, aliases: ["jizan", "gizan", "جازان", "جيزان"] },
  { id: "albaha", en: "Al-Baha", ar: "الباحة", regionEn: "Al-Baha Region", regionAr: "منطقة الباحة", lat: 20.0129, lng: 41.4677, aliases: ["al baha", "al bahah", "albaha", "الباحة", "الباحه"] },
  { id: "sakaka", en: "Sakaka", ar: "سكاكا", regionEn: "Al-Jouf Region", regionAr: "منطقة الجوف", lat: 29.9697, lng: 40.2064, aliases: ["sakakah", "سكاكا"] },
  { id: "arar", en: "Arar", ar: "عرعر", regionEn: "Northern Borders", regionAr: "الحدود الشمالية", lat: 30.9753, lng: 41.0381, aliases: ["عرعر"] },
  { id: "neom", en: "NEOM", ar: "نيوم", regionEn: "Tabuk Region", regionAr: "منطقة تبوك", lat: 28.0871, lng: 35.221, aliases: ["نيوم"] },
  { id: "umluj", en: "Umluj", ar: "أملج", regionEn: "Tabuk Region", regionAr: "منطقة تبوك", lat: 25.05, lng: 37.265, aliases: ["أملج", "املج"] },

  // ─── Riyadh Region ────────────────────────────────────────────────────────
  { id: "alkharj", en: "Al-Kharj", ar: "الخرج", regionEn: "Riyadh Region", regionAr: "منطقة الرياض", lat: 24.1554, lng: 47.312, aliases: ["al kharj", "kharj", "الخرج"] },
  { id: "almajmaah", en: "Al-Majma'ah", ar: "المجمعة", regionEn: "Riyadh Region", regionAr: "منطقة الرياض", lat: 25.9039, lng: 45.3456, aliases: ["al majmaah", "majmaah", "المجمعة", "المجمعه"] },
  { id: "zulfi", en: "Al-Zulfi", ar: "الزلفي", regionEn: "Riyadh Region", regionAr: "منطقة الرياض", lat: 26.2994, lng: 44.8154, aliases: ["az zulfi", "al zulfi", "الزلفي"] },
  { id: "dawadmi", en: "Ad-Dawadmi", ar: "الدوادمي", regionEn: "Riyadh Region", regionAr: "منطقة الرياض", lat: 24.5071, lng: 44.4051, aliases: ["al dawadmi", "dawadimi", "الدوادمي"] },
  { id: "wadiaddawasir", en: "Wadi Ad-Dawasir", ar: "وادي الدواسر", regionEn: "Riyadh Region", regionAr: "منطقة الرياض", lat: 20.4646, lng: 44.7924, aliases: ["wadi al dawasir", "وادي الدواسر"] },
  { id: "afif", en: "Afif", ar: "عفيف", regionEn: "Riyadh Region", regionAr: "منطقة الرياض", lat: 23.9065, lng: 42.9172, aliases: ["عفيف"] },
  { id: "quwayiyah", en: "Al-Quway'iyah", ar: "القويعية", regionEn: "Riyadh Region", regionAr: "منطقة الرياض", lat: 24.0462, lng: 45.2597, aliases: ["al quwayiyah", "القويعية", "القويعيه"] },
  { id: "shaqra", en: "Shaqra", ar: "شقراء", regionEn: "Riyadh Region", regionAr: "منطقة الرياض", lat: 25.2476, lng: 45.2528, aliases: ["شقراء"] },
  { id: "muzahimiyah", en: "Al-Muzahimiyah", ar: "المزاحمية", regionEn: "Riyadh Region", regionAr: "منطقة الرياض", lat: 24.4744, lng: 46.271, aliases: ["al muzahimiyah", "المزاحمية", "المزاحميه"] },
  { id: "hotatbanitamim", en: "Hotat Bani Tamim", ar: "حوطة بني تميم", regionEn: "Riyadh Region", regionAr: "منطقة الرياض", lat: 23.4892, lng: 46.8433, aliases: ["hawta", "حوطة بني تميم"] },
  { id: "layla", en: "Al-Aflaj (Layla)", ar: "الأفلاج (ليلى)", regionEn: "Riyadh Region", regionAr: "منطقة الرياض", lat: 22.2903, lng: 46.7311, aliases: ["aflaj", "al aflaj", "الأفلاج", "ليلى"] },
  { id: "sulayyil", en: "As-Sulayyil", ar: "السليل", regionEn: "Riyadh Region", regionAr: "منطقة الرياض", lat: 20.4607, lng: 45.5779, aliases: ["sulayyil", "السليل"] },
  { id: "dharma", en: "Dharma", ar: "ضرماء", regionEn: "Riyadh Region", regionAr: "منطقة الرياض", lat: 24.6097, lng: 46.1264, aliases: ["dhurma", "ضرماء", "ضرما"] },
  { id: "huraymila", en: "Huraymila", ar: "حريملاء", regionEn: "Riyadh Region", regionAr: "منطقة الرياض", lat: 25.1256, lng: 46.1211, aliases: ["حريملاء"] },
  { id: "thadiq", en: "Thadiq", ar: "ثادق", regionEn: "Riyadh Region", regionAr: "منطقة الرياض", lat: 25.2914, lng: 45.8758, aliases: ["ثادق"] },
  { id: "rumah", en: "Rumah", ar: "رماح", regionEn: "Riyadh Region", regionAr: "منطقة الرياض", lat: 25.5681, lng: 47.1636, aliases: ["رماح"] },
  { id: "alghat", en: "Al-Ghat", ar: "الغاط", regionEn: "Riyadh Region", regionAr: "منطقة الرياض", lat: 26.0268, lng: 44.9609, aliases: ["ghat", "الغاط"] },
  { id: "al-ammariyah", en: "Al-Ammariyah", ar: "العمارية", regionEn: "Riyadh Region", regionAr: "منطقة الرياض", lat: 24.73, lng: 46.49, aliases: ["ammariyah", "alammariyah", "al ammariyah", "العمارية", "العماريه"] },

  // ─── Makkah Region ────────────────────────────────────────────────────────
  { id: "kaec", en: "King Abdullah Economic City", ar: "مدينة الملك عبدالله الاقتصادية", regionEn: "Makkah Region", regionAr: "منطقة مكة المكرمة", lat: 22.4044, lng: 39.1319, aliases: ["kaec", "rabigh kaec", "مدينة الملك عبدالله الاقتصادية"] },
  { id: "rabigh", en: "Rabigh", ar: "رابغ", regionEn: "Makkah Region", regionAr: "منطقة مكة المكرمة", lat: 22.7986, lng: 39.0349, aliases: ["رابغ"] },
  { id: "thuwal", en: "Thuwal", ar: "ثول", regionEn: "Makkah Region", regionAr: "منطقة مكة المكرمة", lat: 22.2833, lng: 39.1061, aliases: ["ثول"] },
  { id: "qunfudhah", en: "Al-Qunfudhah", ar: "القنفذة", regionEn: "Makkah Region", regionAr: "منطقة مكة المكرمة", lat: 19.1264, lng: 41.0789, aliases: ["al qunfudhah", "qunfudhah", "القنفذة", "القنفذه"] },
  { id: "allith", en: "Al-Lith", ar: "الليث", regionEn: "Makkah Region", regionAr: "منطقة مكة المكرمة", lat: 20.1489, lng: 40.2731, aliases: ["al lith", "lith", "الليث"] },
  { id: "aljumum", en: "Al-Jumum", ar: "الجموم", regionEn: "Makkah Region", regionAr: "منطقة مكة المكرمة", lat: 21.6169, lng: 39.6981, aliases: ["jumum", "الجموم"] },
  { id: "khulais", en: "Khulais", ar: "خليص", regionEn: "Makkah Region", regionAr: "منطقة مكة المكرمة", lat: 22.1544, lng: 39.3186, aliases: ["خليص"] },
  { id: "bahrah", en: "Bahrah", ar: "بحرة", regionEn: "Makkah Region", regionAr: "منطقة مكة المكرمة", lat: 21.4017, lng: 39.4508, aliases: ["بحرة", "بحره"] },
  { id: "turbah", en: "Turbah", ar: "تربة", regionEn: "Makkah Region", regionAr: "منطقة مكة المكرمة", lat: 21.2141, lng: 41.6331, aliases: ["تربة", "تربه"] },
  { id: "ranyah", en: "Ranyah", ar: "رنية", regionEn: "Makkah Region", regionAr: "منطقة مكة المكرمة", lat: 21.2489, lng: 42.8528, aliases: ["رنية", "رنيه"] },
  { id: "alkhurma", en: "Al-Khurma", ar: "الخرمة", regionEn: "Makkah Region", regionAr: "منطقة مكة المكرمة", lat: 21.9183, lng: 42.0369, aliases: ["khurma", "الخرمة", "الخرمه"] },
  { id: "maysan", en: "Maysan", ar: "ميسان", regionEn: "Makkah Region", regionAr: "منطقة مكة المكرمة", lat: 20.8225, lng: 40.8256, aliases: ["ميسان"] },

  // ─── Madinah Region ───────────────────────────────────────────────────────
  { id: "badr", en: "Badr", ar: "بدر", regionEn: "Madinah Region", regionAr: "منطقة المدينة المنورة", lat: 23.78, lng: 38.79, aliases: ["بدر"] },
  { id: "khaybar", en: "Khaybar", ar: "خيبر", regionEn: "Madinah Region", regionAr: "منطقة المدينة المنورة", lat: 25.6986, lng: 39.2939, aliases: ["خيبر"] },
  { id: "alhanakiyah", en: "Al-Hanakiyah", ar: "الحناكية", regionEn: "Madinah Region", regionAr: "منطقة المدينة المنورة", lat: 24.855, lng: 40.5019, aliases: ["الحناكية", "الحناكيه"] },
  { id: "mahdaddhahab", en: "Mahd Adh Dhahab", ar: "مهد الذهب", regionEn: "Madinah Region", regionAr: "منطقة المدينة المنورة", lat: 23.5031, lng: 40.8594, aliases: ["مهد الذهب"] },
  { id: "alais", en: "Al-Ais", ar: "العيص", regionEn: "Madinah Region", regionAr: "منطقة المدينة المنورة", lat: 25.0725, lng: 38.105, aliases: ["العيص"] },

  // ─── Eastern Province ─────────────────────────────────────────────────────
  { id: "almubarraz", en: "Al-Mubarraz", ar: "المبرز", regionEn: "Eastern Province", regionAr: "المنطقة الشرقية", lat: 25.4077, lng: 49.5904, aliases: ["mubarraz", "المبرز"] },
  { id: "qatif", en: "Qatif", ar: "القطيف", regionEn: "Eastern Province", regionAr: "المنطقة الشرقية", lat: 26.5196, lng: 50.0115, aliases: ["al qatif", "القطيف"] },
  { id: "saihat", en: "Saihat", ar: "سيهات", regionEn: "Eastern Province", regionAr: "المنطقة الشرقية", lat: 26.475, lng: 50.0417, aliases: ["سيهات"] },
  { id: "hafr", en: "Hafr Al-Batin", ar: "حفر الباطن", regionEn: "Eastern Province", regionAr: "المنطقة الشرقية", lat: 28.4328, lng: 45.9708, aliases: ["hafr al batin", "hafar al batin", "حفر الباطن"] },
  { id: "khafji", en: "Khafji", ar: "الخفجي", regionEn: "Eastern Province", regionAr: "المنطقة الشرقية", lat: 28.4392, lng: 48.4913, aliases: ["al khafji", "الخفجي"] },
  { id: "rastanura", en: "Ras Tanura", ar: "رأس تنورة", regionEn: "Eastern Province", regionAr: "المنطقة الشرقية", lat: 26.7086, lng: 50.062, aliases: ["رأس تنورة", "راس تنوره"] },
  { id: "abqaiq", en: "Abqaiq", ar: "بقيق", regionEn: "Eastern Province", regionAr: "المنطقة الشرقية", lat: 25.9372, lng: 49.6686, aliases: ["buqayq", "بقيق"] },
  { id: "alnairyah", en: "Al-Nairyah", ar: "النعيرية", regionEn: "Eastern Province", regionAr: "المنطقة الشرقية", lat: 27.4694, lng: 48.49, aliases: ["nairyah", "النعيرية", "النعيريه"] },

  // ─── Al-Qassim Region ─────────────────────────────────────────────────────
  { id: "unaizah", en: "Unaizah", ar: "عنيزة", regionEn: "Al-Qassim Region", regionAr: "منطقة القصيم", lat: 26.0844, lng: 43.9936, aliases: ["unayzah", "عنيزة", "عنيزه"] },
  { id: "arrass", en: "Ar-Rass", ar: "الرس", regionEn: "Al-Qassim Region", regionAr: "منطقة القصيم", lat: 25.8694, lng: 43.4973, aliases: ["al rass", "rass", "الرس"] },
  { id: "albukayriyah", en: "Al-Bukayriyah", ar: "البكيرية", regionEn: "Al-Qassim Region", regionAr: "منطقة القصيم", lat: 26.1436, lng: 43.6589, aliases: ["bukayriyah", "البكيرية", "البكيريه"] },
  { id: "albadayea", en: "Al-Badayea", ar: "البدائع", regionEn: "Al-Qassim Region", regionAr: "منطقة القصيم", lat: 25.9994, lng: 43.7192, aliases: ["badayea", "البدائع", "البدايع"] },
  { id: "almidhnab", en: "Al-Midhnab", ar: "المذنب", regionEn: "Al-Qassim Region", regionAr: "منطقة القصيم", lat: 25.8606, lng: 44.2225, aliases: ["midhnab", "المذنب"] },

  // ─── Asir Region ──────────────────────────────────────────────────────────
  { id: "bisha", en: "Bisha", ar: "بيشة", regionEn: "Asir Region", regionAr: "منطقة عسير", lat: 20.0005, lng: 42.6052, aliases: ["بيشة", "بيشه"] },
  { id: "muhayil", en: "Muhayil Asir", ar: "محايل عسير", regionEn: "Asir Region", regionAr: "منطقة عسير", lat: 18.5453, lng: 42.0503, aliases: ["muhayil", "محايل", "محايل عسير"] },
  { id: "annamas", en: "An-Namas", ar: "النماص", regionEn: "Asir Region", regionAr: "منطقة عسير", lat: 19.1208, lng: 42.1294, aliases: ["al namas", "namas", "النماص"] },
  { id: "tanomah", en: "Tanomah", ar: "تنومة", regionEn: "Asir Region", regionAr: "منطقة عسير", lat: 18.9183, lng: 42.1642, aliases: ["tanumah", "تنومة", "تنومه"] },
  { id: "rijalalma", en: "Rijal Almaa", ar: "رجال ألمع", regionEn: "Asir Region", regionAr: "منطقة عسير", lat: 18.2108, lng: 42.2756, aliases: ["رجال ألمع", "رجال المع"] },
  { id: "ahadrafidah", en: "Ahad Rafidah", ar: "أحد رفيدة", regionEn: "Asir Region", regionAr: "منطقة عسير", lat: 18.2064, lng: 42.8386, aliases: ["أحد رفيدة", "احد رفيده"] },
  { id: "saratabidah", en: "Sarat Abidah", ar: "سراة عبيدة", regionEn: "Asir Region", regionAr: "منطقة عسير", lat: 18.0819, lng: 43.1336, aliases: ["سراة عبيدة", "سراه عبيده"] },
  { id: "dhahranaljanoub", en: "Dhahran Al-Janoub", ar: "ظهران الجنوب", regionEn: "Asir Region", regionAr: "منطقة عسير", lat: 17.6697, lng: 43.5169, aliases: ["ظهران الجنوب"] },
  { id: "tathlith", en: "Tathlith", ar: "تثليث", regionEn: "Asir Region", regionAr: "منطقة عسير", lat: 19.5322, lng: 43.5117, aliases: ["تثليث"] },

  // ─── Tabuk Region ─────────────────────────────────────────────────────────
  { id: "alwajh", en: "Al-Wajh", ar: "الوجه", regionEn: "Tabuk Region", regionAr: "منطقة تبوك", lat: 26.2367, lng: 36.4689, aliases: ["al wajh", "wajh", "الوجه"] },
  { id: "duba", en: "Duba", ar: "ضباء", regionEn: "Tabuk Region", regionAr: "منطقة تبوك", lat: 27.3514, lng: 35.69, aliases: ["ضباء", "ضبا"] },
  { id: "haql", en: "Haql", ar: "حقل", regionEn: "Tabuk Region", regionAr: "منطقة تبوك", lat: 29.2856, lng: 34.9389, aliases: ["حقل"] },
  { id: "tayma", en: "Tayma", ar: "تيماء", regionEn: "Tabuk Region", regionAr: "منطقة تبوك", lat: 27.6292, lng: 38.5453, aliases: ["تيماء", "تيما"] },

  // ─── Ha'il Region ─────────────────────────────────────────────────────────
  { id: "baqaa", en: "Baqaa", ar: "بقعاء", regionEn: "Ha'il Region", regionAr: "منطقة حائل", lat: 27.9056, lng: 42.3931, aliases: ["بقعاء", "بقعا"] },
  { id: "alghazalah", en: "Al-Ghazalah", ar: "الغزالة", regionEn: "Ha'il Region", regionAr: "منطقة حائل", lat: 26.7931, lng: 41.3125, aliases: ["الغزالة", "الغزاله"] },

  // ─── Northern Borders ─────────────────────────────────────────────────────
  { id: "rafha", en: "Rafha", ar: "رفحاء", regionEn: "Northern Borders", regionAr: "الحدود الشمالية", lat: 29.6214, lng: 43.4956, aliases: ["رفحاء", "رفحا"] },
  { id: "turaif", en: "Turaif", ar: "طريف", regionEn: "Northern Borders", regionAr: "الحدود الشمالية", lat: 31.6725, lng: 38.6633, aliases: ["طريف"] },

  // ─── Jazan Region ─────────────────────────────────────────────────────────
  { id: "sabya", en: "Sabya", ar: "صبيا", regionEn: "Jazan Region", regionAr: "منطقة جازان", lat: 17.1494, lng: 42.6253, aliases: ["صبيا"] },
  { id: "abuarish", en: "Abu Arish", ar: "أبو عريش", regionEn: "Jazan Region", regionAr: "منطقة جازان", lat: 16.9689, lng: 42.8325, aliases: ["أبو عريش", "ابو عريش"] },
  { id: "samtah", en: "Samtah", ar: "صامطة", regionEn: "Jazan Region", regionAr: "منطقة جازان", lat: 16.5972, lng: 42.9439, aliases: ["صامطة", "صامطه"] },
  { id: "baish", en: "Baish", ar: "بيش", regionEn: "Jazan Region", regionAr: "منطقة جازان", lat: 17.3728, lng: 42.5364, aliases: ["بيش"] },
  { id: "addarb", en: "Ad-Darb", ar: "الدرب", regionEn: "Jazan Region", regionAr: "منطقة جازان", lat: 17.7219, lng: 42.2519, aliases: ["الدرب"] },
  { id: "farasan", en: "Farasan", ar: "فرسان", regionEn: "Jazan Region", regionAr: "منطقة جازان", lat: 16.7022, lng: 42.1183, aliases: ["جزر فرسان", "فرسان"] },

  // ─── Najran Region ────────────────────────────────────────────────────────
  { id: "sharurah", en: "Sharurah", ar: "شرورة", regionEn: "Najran Region", regionAr: "منطقة نجران", lat: 17.4856, lng: 47.1131, aliases: ["شرورة", "شروره"] },

  // ─── Al-Baha Region ───────────────────────────────────────────────────────
  { id: "baljurashi", en: "Baljurashi", ar: "بلجرشي", regionEn: "Al-Baha Region", regionAr: "منطقة الباحة", lat: 19.8586, lng: 41.5572, aliases: ["بلجرشي"] },
  { id: "almakhwah", en: "Al-Makhwah", ar: "المخواة", regionEn: "Al-Baha Region", regionAr: "منطقة الباحة", lat: 19.7764, lng: 41.4342, aliases: ["المخواة", "المخواه"] },
  { id: "almandaq", en: "Al-Mandaq", ar: "المندق", regionEn: "Al-Baha Region", regionAr: "منطقة الباحة", lat: 20.1567, lng: 41.2894, aliases: ["المندق"] },

  // ─── Al-Jouf Region ───────────────────────────────────────────────────────
  { id: "alqurayyat", en: "Al-Qurayyat", ar: "القريات", regionEn: "Al-Jouf Region", regionAr: "منطقة الجوف", lat: 31.3318, lng: 37.3428, aliases: ["qurayyat", "al qurayyat", "القريات"] },
  { id: "dumataljandal", en: "Dumat Al-Jandal", ar: "دومة الجندل", regionEn: "Al-Jouf Region", regionAr: "منطقة الجوف", lat: 29.8117, lng: 39.8669, aliases: ["دومة الجندل", "دومه الجندل"] },
  { id: "tabarjal", en: "Tabarjal", ar: "طبرجل", regionEn: "Al-Jouf Region", regionAr: "منطقة الجوف", lat: 30.4997, lng: 38.2203, aliases: ["طبرجل"] },
];

export function normalizeCitySearchKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/['’\-_,./]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CITY_BY_EXACT_KEY = new Map<string, SaudiCityDefinition>();

for (const city of SAUDI_ALL_CITIES) {
  const keys = [city.id, city.en, city.ar, ...(city.aliases || [])];
  for (const key of keys) {
    const normalized = normalizeCitySearchKey(key);
    if (normalized && !CITY_BY_EXACT_KEY.has(normalized)) {
      CITY_BY_EXACT_KEY.set(normalized, city);
    }
  }
}

export function resolveSaudiCity(raw: string | null | undefined): SaudiCityDefinition | undefined {
  if (!raw || !raw.trim()) return undefined;
  const key = normalizeCitySearchKey(raw);
  const exact = CITY_BY_EXACT_KEY.get(key);
  if (exact) return exact;

  // Match prefix/substring only for multi-character queries after exact pass fails
  if (key.length >= 3) {
    return SAUDI_ALL_CITIES.find((c) => {
      const candidates = [c.en, c.ar, ...(c.aliases || [])].map(normalizeCitySearchKey);
      return candidates.some((cand) => cand.includes(key) || key.includes(cand));
    });
  }
  return undefined;
}

export function normalizeSaudiCityId(raw: string | null | undefined): string {
  if (!raw || !raw.trim()) return "";
  const match = resolveSaudiCity(raw);
  if (match) return match.id;
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getLocalizedSaudiCity(
  raw: string | null | undefined,
  locale: "en" | "ar"
): string {
  if (!raw || !raw.trim()) {
    return locale === "ar" ? "الرياض" : "Riyadh";
  }
  const match = resolveSaudiCity(raw);
  if (match) {
    return locale === "ar" ? match.ar : match.en;
  }
  return raw.trim();
}

export const CITY_NAMES_AR_LOOKUP: Record<string, string> = Object.fromEntries([
  ["all", "جميع الوجهات السعودية"],
  ...SAUDI_ALL_CITIES.map((c) => [c.id, c.ar]),
]);

export const CITY_NAMES_EN_LOOKUP: Record<string, string> = Object.fromEntries([
  ["all", "All Destinations"],
  ...SAUDI_ALL_CITIES.map((c) => [c.id, c.en]),
]);
