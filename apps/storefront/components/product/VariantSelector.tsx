"use client";

import { useState, useMemo } from "react";
import { useCart } from "@shopify/hydrogen-react";
import { Money } from "@/components/ui/Money";
import type { ProductVariant } from "@/lib/shopify/types";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/getMessages";
import { useCartDrawer } from "@/components/cart/CartDrawerContext";

interface VariantSelectorProps {
  variants: ProductVariant[];
  locale: Locale;
  messages: Messages;
}

// Derive unique option names and their values from the full variant list
function buildOptionMap(
  variants: ProductVariant[],
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const v of variants) {
    for (const opt of v.selectedOptions) {
      if (!map.has(opt.name)) map.set(opt.name, []);
      const values = map.get(opt.name)!;
      if (!values.includes(opt.value)) values.push(opt.value);
    }
  }
  return map;
}

// Find the variant that exactly matches the current selections
function matchVariant(
  variants: ProductVariant[],
  selections: Record<string, string>,
): ProductVariant | undefined {
  return variants.find((v) =>
    v.selectedOptions.every((o) => selections[o.name] === o.value),
  );
}

// Check whether a particular option value is available given the other current selections
function isValueAvailable(
  variants: ProductVariant[],
  selections: Record<string, string>,
  optionName: string,
  optionValue: string,
): boolean {
  return variants.some(
    (v) =>
      v.availableForSale &&
      v.selectedOptions.every((o) =>
        o.name === optionName ? o.value === optionValue : selections[o.name] === o.value,
      ),
  );
}

export function VariantSelector({
  variants,
  locale,
  messages,
}: VariantSelectorProps) {
  const { linesAdd, status } = useCart();
  const { open: openCart } = useCartDrawer();

  const optionMap = useMemo(() => buildOptionMap(variants), [variants]);
  const hasOptions =
    optionMap.size > 1 ||
    (optionMap.size === 1 && [...optionMap.values()][0].length > 1);

  // Initialise with first available option value for each name
  const initialSelections = useMemo<Record<string, string>>(() => {
    const result: Record<string, string> = {};
    for (const [name, values] of optionMap) {
      result[name] = values[0];
    }
    return result;
  }, [optionMap]);

  const [selections, setSelections] = useState(initialSelections);
  const [added, setAdded] = useState(false);

  const selectedVariant = matchVariant(variants, selections);
  const busy = status === "updating" || status === "creating";

  function handleAdd() {
    if (!selectedVariant?.availableForSale || busy) return;
    linesAdd([{ merchandiseId: selectedVariant.id, quantity: 1 }]);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      openCart();
    }, 800);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Price for currently selected variant */}
      {selectedVariant && (
        <Money
          data={selectedVariant.price}
          locale={locale}
          className="text-2xl font-bold text-stone-900 tabular-nums"
        />
      )}

      {/* Option selectors — hidden when product has only "Default Title" */}
      {hasOptions && (
        <div className="flex flex-col gap-4">
          {[...optionMap.entries()].map(([name, values]) => (
            <div key={name}>
              <label
                htmlFor={`option-${name}`}
                className="mb-1.5 block text-sm font-semibold text-stone-700"
              >
                {name}
                {selections[name] && (
                  <span className="ms-2 font-normal text-stone-500">
                    {selections[name]}
                  </span>
                )}
              </label>

              <div className="flex flex-wrap gap-2">
                {values.map((value) => {
                  const active = selections[name] === value;
                  const available = isValueAvailable(
                    variants,
                    selections,
                    name,
                    value,
                  );
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setSelections((prev) => ({ ...prev, [name]: value }))
                      }
                      disabled={!available}
                      aria-pressed={active}
                      className={`relative min-w-[3rem] rounded-lg border px-4 py-2 text-sm
                                  font-medium transition-colors
                                  ${active
                                    ? "border-stone-900 bg-stone-900 text-white"
                                    : available
                                      ? "border-stone-200 text-stone-700 hover:border-stone-400"
                                      : "cursor-not-allowed border-stone-100 text-stone-300 line-through"}`}
                    >
                      {value}
                      {/* Diagonal slash for sold-out values */}
                      {!available && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <span className="h-px w-full rotate-[-30deg] bg-stone-200" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add to cart */}
      {selectedVariant?.availableForSale ? (
        <button
          type="button"
          onClick={handleAdd}
          disabled={busy || added}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full
                     bg-amber-500 text-sm font-semibold text-white transition-colors
                     hover:bg-amber-400 disabled:opacity-70"
        >
          {added ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75
                     0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" />
              </svg>
              Added — opening cart
            </>
          ) : (
            messages.product.addToCart
          )}
        </button>
      ) : (
        <div className="flex h-12 w-full items-center justify-center rounded-full
                        border border-stone-200 text-sm text-stone-400">
          {messages.product.outOfStock}
        </div>
      )}
    </div>
  );
}
