export type Language = "en" | "ar";

export {
  CITY_NAMES_AR,
  CATEGORY_NAMES_AR,
  PROPERTY_TITLES_AR,
  PROPERTY_SPECS_AR,
} from "./translations/arMetadata";

import { enTranslations } from "./translations/en";
import { arTranslations } from "./translations/ar";

export const TRANSLATIONS = {
  en: enTranslations,
  ar: arTranslations,
};
