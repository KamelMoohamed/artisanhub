"use client";

import { useCart } from "@shopify/hydrogen-react";
import { useState } from "react";

interface AddToCartButtonProps {
  variantId: string;
  available: boolean;
  label: string;
  outOfStockLabel: string;
}

export function AddToCartButton({
  variantId,
  available,
  label,
  outOfStockLabel,
}: AddToCartButtonProps) {
  const { linesAdd, status } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    if (!available || status === "updating") return;
    linesAdd([{ merchandiseId: variantId, quantity: 1 }]);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  if (!available) {
    return (
      <span
        className="flex h-10 w-full items-center justify-center rounded-full
                   border border-stone-200 text-sm text-stone-400"
      >
        {outOfStockLabel}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={status === "updating" || added}
      className="flex h-10 w-full items-center justify-center gap-1.5 rounded-full
                 bg-stone-900 text-sm font-medium text-white transition-colors
                 hover:bg-stone-700 disabled:opacity-60"
    >
      {added ? (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
              clipRule="evenodd"
            />
          </svg>
          Added
        </>
      ) : (
        label
      )}
    </button>
  );
}
