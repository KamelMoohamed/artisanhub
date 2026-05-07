"use client";

import { CartProvider, ShopifyProvider } from "@shopify/hydrogen-react";
import type {
  CountryCode,
  LanguageCode,
} from "@shopify/hydrogen-react/storefront-api-types";

// Keep this in sync with `lib/shopify/client.ts`. Hydrogen-react ships its own
// default (`2026-04`), but we pin it here so client-side cart calls and
// server-side fetches hit the same Storefront API version.
const STOREFRONT_API_VERSION = "2025-01";

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
  // Both env vars are also read in `lib/shopify/client.ts`.
  // They are `NEXT_PUBLIC_*` so they're available on the client.
  const storeDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const storefrontToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

  if (!storeDomain || !storefrontToken) {
    // Surface a loud error in dev rather than a silent broken cart.
    throw new Error(
      "Missing NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN or NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN. " +
        "Set both in apps/storefront/.env.local for hydrogen-react cart actions to work.",
    );
  }

  return (
    <ShopifyProvider
      storeDomain={storeDomain}
      storefrontToken={storefrontToken}
      storefrontApiVersion={STOREFRONT_API_VERSION}
      countryIsoCode={countryCode}
      languageIsoCode={languageCode}
    >
      <CartProvider countryCode={countryCode} languageCode={languageCode}>
        {children}
      </CartProvider>
    </ShopifyProvider>
  );
}
