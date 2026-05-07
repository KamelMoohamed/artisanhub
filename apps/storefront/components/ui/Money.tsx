import { i18nConfig, type Locale } from "@/lib/i18n/config";
import { Money as HydrogenMoney } from "@shopify/hydrogen-react";
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
 * Thin wrapper around `@shopify/hydrogen-react`'s Money component.
 *
 * When `locale` is provided:
 *   - Uses `i18nConfig[locale].currency` as the currency fallback if
 *     `data.currencyCode` is absent.
 *   - Formats the number with the locale-correct `Intl.NumberFormat` (e.g.
 *     French commas, Arabic-Indic digits) by overriding hydrogen-react's
 *     system-locale default.
 *
 * When `locale` is omitted, behaviour is identical to the base component.
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

  // Resolve currency: use data's value, fall back to locale's currency, then USD
  const currencyCode = (
    data.currencyCode || localeConfig?.currency || "USD"
  ) as CurrencyCode;

  const resolvedData: { amount: string; currencyCode: CurrencyCode } = {
    amount: data.amount ?? "0",
    currencyCode,
  };

  // When a locale is given, format with Intl directly so number separators
  // and digit sets match the user's language (e.g. ١٢٣ for Arabic).
  // hydrogen-react's Money relies on navigator.language (browser default),
  // which may not match the app locale on SSR or a fresh tab.
  if (locale) {
    const amount = parseFloat(resolvedData.amount);
    const formatted = new Intl.NumberFormat(intlLocale[locale], {
      style: withoutCurrency ? "decimal" : "currency",
      currency: withoutCurrency ? undefined : currencyCode,
      minimumFractionDigits: withoutTrailingZeros ? 0 : 2,
      maximumFractionDigits: withoutTrailingZeros ? 0 : 2,
    }).format(amount);

    return (
      <Tag className={className} {...rest}>
        {formatted}
      </Tag>
    );
  }

  // Without locale, delegate entirely to hydrogen-react for its full feature
  // set (measurement, measurementSeparator, etc.)
  return (
    <HydrogenMoney
      data={resolvedData}
      as={Tag}
      withoutCurrency={withoutCurrency}
      withoutTrailingZeros={withoutTrailingZeros}
      className={className}
      {...(rest as object)}
    />
  );
}
