export type Locale = "en" | "ar" | "fr";

export const locales: Locale[] = ["en", "ar", "fr"];

export const i18nConfig: Record<
  Locale,
  {
    language: string;
    currency: string;
    countryCode: string;
    direction: "ltr" | "rtl";
    label: string;
    flag: string;
  }
> = {
  en: {
    language: "EN",
    currency: "AUD",
    countryCode: "AU",
    direction: "ltr",
    label: "English",
    flag: "🇦🇺",
  },
  ar: {
    language: "AR",
    currency: "USD",
    countryCode: "EG",
    direction: "rtl",
    label: "العربية",
    flag: "🇪🇬",
  },
  fr: {
    language: "FR",
    currency: "EUR",
    countryCode: "FR",
    direction: "ltr",
    label: "Français",
    flag: "🇫🇷",
  },
};