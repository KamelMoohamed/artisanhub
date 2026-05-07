"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { storeFetchClient } from "@/lib/shopify/client";
import { PREDICTIVE_SEARCH_QUERY } from "@/lib/shopify/queries/search";
import { Money } from "@/components/ui/Money";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/getMessages";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PredictiveProduct {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  featuredImage: { url: string; altText: string | null } | null;
}

interface PredictiveCollection {
  id: string;
  title: string;
  handle: string;
}

interface PredictiveSearchData {
  predictiveSearch: {
    products: PredictiveProduct[];
    collections: PredictiveCollection[];
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 300;
const MIN_QUERY_LEN = 2;

// ─── Component ────────────────────────────────────────────────────────────────

interface SearchProps {
  locale: Locale;
  messages: Messages;
  /** "bar" = slim inline bar (header); "page" = full-width with larger input */
  variant?: "bar" | "page";
  defaultValue?: string;
}

export function Search({
  locale,
  messages,
  variant = "bar",
  defaultValue = "",
}: SearchProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState<PredictiveSearchData["predictiveSearch"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Flatten all dropdown items for keyboard navigation
  const allItems: { href: string; label: string }[] = [
    ...(results?.products ?? []).map((p) => ({
      href: `/${locale}/products/${p.handle}`,
      label: p.title,
    })),
    ...(results?.collections ?? []).map((c) => ({
      href: `/${locale}/products?collection=${c.handle}`,
      label: c.title,
    })),
  ];

  // ── Debounced search ───────────────────────────────────────────────────────
  const fetchResults = useCallback(
    async (q: string) => {
      if (q.length < MIN_QUERY_LEN) {
        setResults(null);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        const data = await storeFetchClient<PredictiveSearchData>({
          query: PREDICTIVE_SEARCH_QUERY,
          variables: { query: q },
        });
        setResults(data.predictiveSearch);
        setOpen(true);
        setActiveIndex(-1);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const id = setTimeout(() => fetchResults(query), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query, fetchResults]);

  // ── Click outside to close ─────────────────────────────────────────────────
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Keyboard navigation ────────────────────────────────────────────────────
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "Enter") {
      if (activeIndex >= 0 && allItems[activeIndex]) {
        router.push(allItems[activeIndex].href);
        setOpen(false);
      } else if (query.trim()) {
        router.push(`/${locale}/search?q=${encodeURIComponent(query.trim())}`);
        setOpen(false);
      }
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/${locale}/search?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  }

  const hasProducts    = (results?.products.length ?? 0) > 0;
  const hasCollections = (results?.collections.length ?? 0) > 0;
  const hasResults     = hasProducts || hasCollections;
  const showEmpty      = open && !loading && query.length >= MIN_QUERY_LEN && !hasResults;

  const inputClass =
    variant === "page"
      ? "w-full rounded-2xl border border-stone-200 bg-white py-4 ps-5 pe-12 text-base " +
        "shadow-sm outline-none placeholder:text-stone-400 focus:border-amber-400 " +
        "focus:ring-2 focus:ring-amber-200 transition"
      : "w-full rounded-full border border-stone-200 bg-stone-50 py-2 ps-4 pe-10 text-sm " +
        "outline-none placeholder:text-stone-400 focus:border-amber-400 " +
        "focus:bg-white focus:ring-2 focus:ring-amber-100 transition";

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input */}
      <form onSubmit={handleSubmit} role="search">
        <label htmlFor="storefront-search" className="sr-only">
          {messages.search.placeholder}
        </label>
        <div className="relative">
          <input
            id="storefront-search"
            ref={inputRef}
            type="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => hasResults && setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={messages.search.placeholder}
            className={inputClass}
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls="search-dropdown"
          />

          {/* Search icon / spinner */}
          <span className={`pointer-events-none absolute inset-y-0 end-3 flex items-center
                            ${variant === "page" ? "end-4" : ""}`}>
            {loading ? (
              <svg className="h-4 w-4 animate-spin text-stone-400"
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                fill="currentColor" className="h-4 w-4 text-stone-400">
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452
                     4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" />
              </svg>
            )}
          </span>
        </div>
      </form>

      {/* Dropdown */}
      {open && (hasResults || showEmpty) && (
        <div
          id="search-dropdown"
          role="listbox"
          aria-label="Search suggestions"
          className="absolute start-0 top-full z-50 mt-2 w-full min-w-[320px] overflow-hidden
                     rounded-2xl border border-stone-200 bg-white shadow-xl ring-1 ring-black/5"
        >
          {showEmpty && (
            <p className="px-5 py-4 text-sm text-stone-500">
              {messages.search.noResults}
            </p>
          )}

          {/* Products */}
          {hasProducts && (
            <div>
              <p className="border-b border-stone-100 px-4 py-2 text-[11px] font-semibold
                             uppercase tracking-wider text-stone-400">
                Products
              </p>
              <ul>
                {results!.products.map((product, i) => {
                  const isActive = activeIndex === i;
                  return (
                    <li key={product.id} role="option" aria-selected={isActive}>
                      <Link
                        href={`/${locale}/products/${product.handle}`}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 transition-colors
                                    ${isActive ? "bg-amber-50" : "hover:bg-stone-50"}`}
                      >
                        {/* Thumbnail */}
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden
                                        rounded-lg bg-stone-100">
                          {product.featuredImage ? (
                            <Image
                              src={product.featuredImage.url}
                              alt={product.featuredImage.altText ?? product.title}
                              fill sizes="40px" className="object-cover"
                            />
                          ) : (
                            <span className="flex h-full items-center justify-center
                                             text-stone-300 text-xs">?</span>
                          )}
                        </div>
                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-stone-800">
                            {product.title}
                          </p>
                          <p className="text-xs text-stone-400">{product.vendor}</p>
                        </div>
                        {/* Price */}
                        <Money
                          data={product.priceRange.minVariantPrice}
                          locale={locale}
                          className="shrink-0 text-xs font-semibold text-stone-700 tabular-nums"
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Collections */}
          {hasCollections && (
            <div className={hasProducts ? "border-t border-stone-100" : ""}>
              <p className="border-b border-stone-100 px-4 py-2 text-[11px] font-semibold
                             uppercase tracking-wider text-stone-400">
                Collections
              </p>
              <ul>
                {results!.collections.map((col, i) => {
                  const idx = (results?.products.length ?? 0) + i;
                  const isActive = activeIndex === idx;
                  return (
                    <li key={col.id} role="option" aria-selected={isActive}>
                      <Link
                        href={`/${locale}/products?collection=${col.handle}`}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 transition-colors
                                    ${isActive ? "bg-amber-50" : "hover:bg-stone-50"}`}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center
                                         rounded-lg bg-stone-100 text-stone-400">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor" className="h-4 w-4">
                            <path d="M2 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1
                                     1 0 0 0-1-1H2ZM2 9a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h16a1 1
                                     0 0 0 1-1v-6a1 1 0 0 0-1-1H2Z" />
                          </svg>
                        </span>
                        <span className="text-sm font-medium text-stone-700">{col.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* View all results footer */}
          {hasResults && (
            <div className="border-t border-stone-100 px-4 py-3">
              <Link
                href={`/${locale}/search?q=${encodeURIComponent(query)}`}
                onClick={() => setOpen(false)}
                className="text-xs font-medium text-amber-600 hover:text-amber-700"
              >
                View all results for &ldquo;{query}&rdquo; →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
