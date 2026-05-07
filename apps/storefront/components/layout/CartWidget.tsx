"use client";

import { useCart } from "@shopify/hydrogen-react";
import { Money } from "@shopify/hydrogen-react";
import { useCartDrawer } from "@/components/cart/CartDrawerContext";

interface CartWidgetProps {
  label: string;
}

export function CartWidget({ label }: CartWidgetProps) {
  const { totalQuantity = 0, cost, status } = useCart();
  const { toggle } = useCartDrawer();

  const subtotal = cost?.subtotalAmount;
  const hasItems = totalQuantity > 0;
  const loading = status === "fetching" || status === "creating";

  return (
    <button
      onClick={toggle}
      aria-label={`${label}${hasItems ? ` (${totalQuantity})` : ""}`}
      aria-expanded={undefined}
      className="group relative flex items-center gap-2 rounded-full py-1.5 ps-3 pe-4
                 text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
    >
      {/* Cart icon */}
      <span className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.75}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.93-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
          />
        </svg>

        {/* Count badge */}
        {hasItems && (
          <span
            className="absolute -top-1.5 -end-1.5 flex h-4 w-4 items-center justify-center
                       rounded-full bg-amber-500 text-[10px] font-bold leading-none text-white"
          >
            {totalQuantity > 9 ? "9+" : totalQuantity}
          </span>
        )}
      </span>

      {/* Subtotal via hydrogen-react <Money> */}
      {hasItems && subtotal && !loading ? (
        <Money
          data={subtotal}
          className="text-sm font-semibold tabular-nums text-stone-800"
        />
      ) : loading ? (
        <span className="h-4 w-12 animate-pulse rounded bg-stone-200" />
      ) : (
        <span className="text-sm font-medium">{label}</span>
      )}
    </button>
  );
}
