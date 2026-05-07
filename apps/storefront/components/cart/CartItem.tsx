"use client";

import Image from "next/image";
import { useCart } from "@shopify/hydrogen-react";
import { Money } from "@/components/ui/Money";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/getMessages";

// Minimal shape we actually use — avoids coupling to the full Storefront CartLine type
export interface CartLineItem {
  id: string;
  quantity: number;
  cost: {
    totalAmount: { amount: string; currencyCode: string };
  };
  merchandise: {
    id: string;
    title: string;
    price: { amount: string; currencyCode: string };
    image?: { url: string; altText: string | null } | null;
    product: {
      title: string;
      handle: string;
      featuredImage: { url: string; altText: string | null } | null;
    };
    selectedOptions: { name: string; value: string }[];
  };
}

interface CartItemProps {
  line: CartLineItem;
  locale: Locale;
  messages: Messages;
}

export function CartItem({ line, locale, messages }: CartItemProps) {
  const { linesUpdate, linesRemove, status } = useCart();
  const busy = status === "updating";

  const { id, quantity, cost, merchandise } = line;
  // Prefer variant image, fall back to product featured image
  const image = merchandise.image ?? merchandise.product.featuredImage;

  // Non-default variant options (skip "Title" / "Default Title")
  const options = merchandise.selectedOptions.filter(
    (o) => o.value !== "Default Title",
  );

  function setQuantity(qty: number) {
    if (qty < 1) return;
    linesUpdate([{ id, quantity: qty }]);
  }

  return (
    <li className="flex gap-4 py-5 first:pt-0">
      {/* Image */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-stone-100">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText ?? merchandise.product.title}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-stone-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={1} stroke="currentColor" className="h-8 w-8">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5
                   1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 18h16.5M3.75
                   3.75h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75
                   A2.25 2.25 0 0 1 1.5 18V6A2.25 2.25 0 0 1 3.75 3.75Z" />
            </svg>
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <p className="truncate text-sm font-semibold text-stone-800">
          {merchandise.product.title}
        </p>

        {/* Variant options */}
        {options.length > 0 && (
          <p className="text-xs text-stone-500">
            {options.map((o) => o.value).join(" / ")}
          </p>
        )}

        {/* Unit price */}
        <Money
          data={merchandise.price}
          locale={locale}
          className="text-xs text-stone-500"
        />

        {/* Quantity stepper + line total */}
        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex items-center rounded-full border border-stone-200">
            <button
              onClick={() => setQuantity(quantity - 1)}
              disabled={busy || quantity <= 1}
              aria-label="Decrease quantity"
              className="flex h-7 w-7 items-center justify-center rounded-s-full
                         text-stone-500 transition-colors hover:bg-stone-100
                         disabled:opacity-30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                fill="currentColor" className="h-3.5 w-3.5">
                <path d="M6.75 9.25a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" />
              </svg>
            </button>

            <span className="w-8 text-center text-sm tabular-nums text-stone-800">
              {quantity}
            </span>

            <button
              onClick={() => setQuantity(quantity + 1)}
              disabled={busy}
              aria-label="Increase quantity"
              className="flex h-7 w-7 items-center justify-center rounded-e-full
                         text-stone-500 transition-colors hover:bg-stone-100
                         disabled:opacity-30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                fill="currentColor" className="h-3.5 w-3.5">
                <path d="M10.75 6.75a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z" />
              </svg>
            </button>
          </div>

          {/* Line total */}
          <Money
            data={cost.totalAmount}
            locale={locale}
            className="text-sm font-semibold text-stone-900 tabular-nums"
          />

          {/* Remove */}
          <button
            onClick={() => linesRemove([id])}
            disabled={busy}
            aria-label={messages.cart.remove}
            className="ms-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full
                       text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500
                       disabled:opacity-30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
              fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" clipRule="evenodd"
                d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23
                   1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0
                   2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14
                   4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69
                   0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0
                   1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" />
            </svg>
          </button>
        </div>
      </div>
    </li>
  );
}
