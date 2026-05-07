"use client";

import { CartProvider } from "@shopify/hydrogen-react";
import type { CountryCode, LanguageCode } from "@shopify/hydrogen-react/storefront-api-types";

interface ShopifyCartProviderProps {
  children: React.ReactNode;
  countryCode: CountryCode;
  languageCode: LanguageCode;
}

export function ShopifyCartProvider({
  children,
  countryCode,
  languageCode,
}: ShopifyCartProviderProps) {
  return (
    <CartProvider
      countryCode={countryCode}
      languageCode={languageCode}
    >
      {children}
    </CartProvider>
  );
}
