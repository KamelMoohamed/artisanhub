"use client";

import Link from "next/link";
import { useCart } from "@shopify/hydrogen-react";
import { Money } from "@/components/ui/Money";
import { CartItem, type CartLineItem } from "@/components/cart/CartItem";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/getMessages";

interface CartPageClientProps {
  locale: Locale;
  messages: Messages;
}

export function CartPageClient({ locale, messages }: CartPageClientProps) {
  const { lines = [], cost, checkoutUrl, totalQuantity = 0, status } = useCart();

  const cartLines = lines as unknown as CartLineItem[];
  const isEmpty = cartLines.length === 0;
  const loading = status === "fetching" || status === "creating";

  // ── Empty / loading state ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6 lg:px-8">
        <ul className="divide-y divide-stone-100">
          {[1, 2, 3].map((i) => (
            <li key={i} className="flex gap-5 py-6">
              <div className="h-24 w-24 shrink-0 animate-pulse rounded-xl bg-stone-100" />
              <div className="flex flex-1 flex-col gap-2.5 pt-1">
                <div className="h-4 w-3/4 animate-pulse rounded bg-stone-100" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-stone-100" />
                <div className="mt-auto h-8 w-32 animate-pulse rounded-full bg-stone-100" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center gap-6 py-28 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          strokeWidth={1} stroke="currentColor" className="h-20 w-20 text-stone-200">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75
               m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.93-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5
               14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0
               1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
        </svg>
        <div className="space-y-1">
          <p className="text-lg font-semibold text-stone-700">{messages.cart.empty}</p>
          <p className="text-sm text-stone-400">Add some items to get started.</p>
        </div>
        <Link
          href={`/${locale}/products`}
          className="mt-2 flex h-11 items-center gap-2 rounded-full bg-stone-900 px-7
                     text-sm font-semibold text-white transition-colors hover:bg-stone-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
            className="h-4 w-4" aria-hidden="true">
            <path fillRule="evenodd" clipRule="evenodd"
              d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75
                 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" />
          </svg>
          {messages.nav.products}
        </Link>
      </div>
    );
  }

  // ── Cart with items ──────────────────────────────────────────────────────────
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-stone-900">
        {messages.cart.title}
        <span className="ms-3 text-base font-normal text-stone-400">
          ({totalQuantity} {totalQuantity === 1 ? "item" : "items"})
        </span>
      </h1>

      <div className="flex flex-col gap-10 lg:flex-row lg:items-start">

        {/* ── Line items ── */}
        <div className="flex-1 min-w-0">
          <ul className="divide-y divide-stone-100">
            {cartLines.map((line) => (
              <CartItem
                key={line.id}
                line={line}
                locale={locale}
                messages={messages}
              />
            ))}
          </ul>

          {/* Continue shopping */}
          <div className="mt-8">
            <Link
              href={`/${locale}/products`}
              className="inline-flex items-center gap-1.5 text-sm font-medium
                         text-stone-500 transition-colors hover:text-stone-900"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                className="h-4 w-4" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75
                     0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" />
              </svg>
              Continue shopping
            </Link>
          </div>
        </div>

        {/* ── Order summary ── */}
        <aside className="w-full rounded-2xl border border-stone-100 bg-stone-50
                          p-6 lg:w-80 lg:shrink-0">
          <h2 className="mb-5 text-base font-semibold text-stone-900">Order summary</h2>

          <dl className="space-y-3 text-sm">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <dt className="text-stone-600">Subtotal</dt>
              <dd>
                {cost?.subtotalAmount ? (
                  <Money
                    data={cost.subtotalAmount}
                    locale={locale}
                    className="font-medium text-stone-800 tabular-nums"
                  />
                ) : (
                  <span className="h-4 w-16 animate-pulse rounded bg-stone-200 inline-block" />
                )}
              </dd>
            </div>

            {/* Shipping */}
            <div className="flex items-center justify-between text-stone-500">
              <dt>Shipping</dt>
              <dd>Calculated at checkout</dd>
            </div>

            {/* Taxes */}
            <div className="flex items-center justify-between text-stone-500">
              <dt>Taxes</dt>
              <dd>Calculated at checkout</dd>
            </div>

            <div className="border-t border-stone-200 pt-3">
              <div className="flex items-center justify-between font-semibold">
                <dt className="text-stone-900">{messages.cart.total}</dt>
                <dd>
                  {cost?.totalAmount ? (
                    <Money
                      data={cost.totalAmount}
                      locale={locale}
                      className="text-lg text-stone-900 tabular-nums"
                    />
                  ) : (
                    <span className="h-5 w-20 animate-pulse rounded bg-stone-200 inline-block" />
                  )}
                </dd>
              </div>
            </div>
          </dl>

          {/* Checkout CTA */}
          <a
            href={checkoutUrl ?? "#"}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full
                       bg-amber-500 text-sm font-semibold text-white transition-colors
                       hover:bg-amber-400"
          >
            {messages.cart.checkout}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
              className="h-4 w-4" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd"
                d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5
                   5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75
                   A.75.75 0 0 1 3 10Z" />
            </svg>
          </a>

          <p className="mt-3 text-center text-xs text-stone-400">
            Secure checkout powered by Shopify
          </p>
        </aside>
      </div>
    </div>
  );
}
