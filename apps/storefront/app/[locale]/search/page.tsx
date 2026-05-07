import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/getMessages";
import { storeFetch } from "@/lib/shopify/client";
import { SEARCH_QUERY } from "@/lib/shopify/queries/search";
import type { Product } from "@/lib/shopify/types";
import { Search } from "@/components/ui/Search";
import { ProductCard } from "@/components/product/ProductCard";

interface SearchData {
  search: {
    totalCount: number;
    edges: { node: Product }[];
  };
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const [, { q }] = await Promise.all([params, searchParams]);
  return {
    title: q ? `Search: ${q}` : "Search",
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ locale }, { q = "" }] = await Promise.all([params, searchParams]);
  const messages = await getMessages(locale);

  // Only fetch when there is a non-empty query
  const results =
    q.trim().length > 0
      ? await storeFetch<SearchData>({
          query: SEARCH_QUERY,
          variables: { query: q, first: 48 },
          cache: 30, // short TTL — search results should feel fresh
        })
      : null;

  const products = results?.search.edges.map((e) => e.node) ?? [];
  const total    = results?.search.totalCount ?? 0;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

      {/* Full-width search bar */}
      <div className="mx-auto mb-10 max-w-2xl">
        <Search
          locale={locale}
          messages={messages}
          variant="page"
          defaultValue={q}
        />
      </div>

      {/* Results header */}
      {q.trim() && (
        <div className="mb-6">
          {total > 0 ? (
            <p className="text-sm text-stone-500">
              <span className="font-semibold text-stone-800">{total}</span> result
              {total !== 1 ? "s" : ""} for{" "}
              <span className="font-semibold text-stone-800">&ldquo;{q}&rdquo;</span>
            </p>
          ) : (
            <p className="text-sm text-stone-500">
              {messages.search.noResults} for{" "}
              <span className="font-semibold text-stone-800">&ldquo;{q}&rdquo;</span>
            </p>
          )}
        </div>
      )}

      {/* Product grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
              messages={messages}
            />
          ))}
        </div>
      ) : q.trim() ? (
        // No results state
        <div className="flex flex-col items-center gap-5 py-24 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={1} stroke="currentColor" className="h-16 w-16 text-stone-200">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607
                 10.607Z" />
          </svg>
          <div className="space-y-1">
            <p className="font-semibold text-stone-700">{messages.search.noResults}</p>
            <p className="text-sm text-stone-400">Try a different keyword or browse all products.</p>
          </div>
          <a
            href={`/${locale}/products`}
            className="mt-2 flex h-10 items-center rounded-full bg-stone-900 px-6
                       text-sm font-semibold text-white transition-colors hover:bg-stone-700"
          >
            Browse all products
          </a>
        </div>
      ) : (
        // Landing state — no query entered yet
        <div className="flex flex-col items-center gap-3 py-24 text-center text-stone-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={1} stroke="currentColor" className="h-14 w-14 text-stone-200">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607
                 10.607Z" />
          </svg>
          <p className="text-sm">{messages.search.placeholder}</p>
        </div>
      )}
    </div>
  );
}
