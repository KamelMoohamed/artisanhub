"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@shopify/hydrogen-react";
import { Money } from "@/components/ui/Money";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/getMessages";
import { CartItem, type CartLineItem } from "./CartItem";
import { useCartDrawer } from "./CartDrawerContext";

interface CartDrawerProps {
  locale: Locale;
  messages: Messages;
}

export function CartDrawer({ locale, messages }: CartDrawerProps) {
  const { isOpen, close } = useCartDrawer();
  const { lines = [], cost, checkoutUrl, status } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  // Trap scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const cartLines = lines as unknown as CartLineItem[];
  const isEmpty = cartLines.length === 0;
  const loading = status === "fetching" || status === "creating";

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={close}
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300
                    ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={messages.cart.title}
        className={`fixed inset-y-0 end-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl
                    transition-transform duration-300 ease-in-out
                    ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5">
          <h2 className="text-base font-semibold text-stone-900">
            {messages.cart.title}
          </h2>
          <button
            onClick={close}
            aria-label="Close cart"
            className="flex h-8 w-8 items-center justify-center rounded-full
                       text-stone-500 transition-colors hover:bg-stone-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
              fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10
                       11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10
                       8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6">
          {loading ? (
            // Skeleton
            <ul className="divide-y divide-stone-100">
              {[1, 2].map((i) => (
                <li key={i} className="flex gap-4 py-5">
                  <div className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-stone-100" />
                  <div className="flex flex-1 flex-col gap-2 pt-1">
                    <div className="h-3.5 w-3/4 animate-pulse rounded bg-stone-100" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-stone-100" />
                    <div className="mt-auto h-7 w-28 animate-pulse rounded-full bg-stone-100" />
                  </div>
                </li>
              ))}
            </ul>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                strokeWidth={1} stroke="currentColor" className="h-14 w-14 text-stone-200">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3
                     h11.218c1.121-2.3 2.1-4.684 2.93-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106
                     5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75
                     0 0 1 1.5 0Z" />
              </svg>
              <p className="text-sm text-stone-500">{messages.cart.empty}</p>
            </div>
          ) : (
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
          )}
        </div>

        {/* Footer — only when cart has items */}
        {!isEmpty && (
          <div className="border-t border-stone-100 px-6 py-5 space-y-4">
            {/* Totals */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-600">{messages.cart.total}</span>
              {cost?.totalAmount ? (
                <Money
                  data={cost.totalAmount}
                  locale={locale}
                  className="text-base font-bold text-stone-900 tabular-nums"
                />
              ) : (
                <span className="h-5 w-20 animate-pulse rounded bg-stone-100" />
              )}
            </div>

            {/* Checkout CTA */}
            <a
              href={checkoutUrl ?? "#"}
              className="flex h-12 w-full items-center justify-center rounded-full
                         bg-amber-500 text-sm font-semibold text-white transition-colors
                         hover:bg-amber-400 disabled:opacity-60"
            >
              {messages.cart.checkout}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                fill="currentColor" className="ms-2 h-4 w-4">
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0
                     0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" />
              </svg>
            </a>

            <p className="text-center text-xs text-stone-400">
              Taxes and shipping calculated at checkout
            </p>
          </div>
        )}
      </div>
    </>
  );
}
