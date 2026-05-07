import { i18nConfig, type Locale } from "@/lib/i18n/config";
import type { CurrencyCode } from "@shopify/hydrogen-react/storefront-api-types";

// BCP 47 locale tags used for Intl.NumberFormat
const intlLocale: Record<Locale, string> = {
  en: "en-AU",
  ar: "ar-EG",
  fr: "fr-FR",
};

export interface MoneyData {
  amount: string;
  currencyCode?: CurrencyCode | string;
}

export interface MoneyProps
  extends Omit<React.ComponentPropsWithoutRef<"span">, "children"> {
  data: MoneyData;
  /** Current locale — controls currency fallback and Intl number formatting. */
  locale?: Locale;
  /** Render as a different HTML element. Defaults to `span`. */
  as?: React.ElementType;
  /** Strip the currency symbol from the output. */
  withoutCurrency?: boolean;
  /** Strip trailing zeros, e.g. $10.00 → $10. */
  withoutTrailingZeros?: boolean;
}

/**
 * Server-safe money formatter.
 *
 * Uses `Intl.NumberFormat` with a BCP-47 tag derived from the app locale so
 * number separators and digit sets match the user's language (e.g. ١٢٣ for
 * Arabic, French non-breaking spaces, etc.) consistently between SSR and the
 * client. We intentionally do NOT depend on `@shopify/hydrogen-react`'s
 * `<Money>`: importing it from a server component pulls the package's barrel
 * (which calls `createContext` at module scope) into the RSC bundle and
 * breaks the page.
 *
 * Currency resolution: `data.currencyCode` → `i18nConfig[locale].currency`
 * → `USD`.
 */
export function Money({
  data,
  locale,
  as: Tag = "span",
  withoutCurrency = false,
  withoutTrailingZeros = false,
  className,
  ...rest
}: MoneyProps) {
  const localeConfig = locale ? i18nConfig[locale] : undefined;

  const currencyCode = (
    data.currencyCode || localeConfig?.currency || "USD"
  ) as CurrencyCode;

  const amount = parseFloat(data.amount ?? "0");
  const intlTag = locale ? intlLocale[locale] : undefined;

  const formatted = new Intl.NumberFormat(intlTag, {
    style: withoutCurrency ? "decimal" : "currency",
    currency: withoutCurrency ? undefined : currencyCode,
    minimumFractionDigits: withoutTrailingZeros ? 0 : 2,
    maximumFractionDigits: withoutTrailingZeros ? 0 : 2,
  }).format(Number.isFinite(amount) ? amount : 0);

  return (
    <Tag className={className} {...rest}>
      {formatted}
    </Tag>
  );
}
