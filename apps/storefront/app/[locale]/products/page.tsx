import type { Metadata } from "next";
import Link from "next/link";
import { locales, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/getMessages";
import { storeFetch } from "@/lib/shopify/client";
import { PRODUCTS_QUERY } from "@/lib/shopify/queries/products";
import {
  COLLECTIONS_QUERY,
  COLLECTION_BY_HANDLE_QUERY,
} from "@/lib/shopify/queries/collections";
import type { Product, Collection } from "@/lib/shopify/types";
import { ProductCard } from "@/components/product/ProductCard";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SearchParams {
  collection?: string;
  minPrice?: string;
  maxPrice?: string;
}

interface ProductsData {
  products: { edges: { node: Product }[] };
}

interface CollectionData {
  collection: (Collection & {
    products: { edges: { node: Product }[] };
  }) | null;
}

interface CollectionsData {
  collections: { edges: { node: Collection }[] };
}

// ─── Static price brackets ───────────────────────────────────────────────────

const PRICE_RANGES = [
  { label: "Under $50",    min: undefined, max: 50 },
  { label: "$50 – $100",   min: 50,        max: 100 },
  { label: "$100 – $200",  min: 100,       max: 200 },
  { label: "Over $200",    min: 200,       max: undefined },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildHref(
  locale: string,
  current: SearchParams,
  patch: Partial<SearchParams & { reset: true }>,
): string {
  if ("reset" in patch) return `/${locale}/products`;
  const next = { ...current, ...patch };
  const params = new URLSearchParams();
  if (next.collection) params.set("collection", next.collection);
  if (next.minPrice)   params.set("minPrice", String(next.minPrice));
  if (next.maxPrice)   params.set("maxPrice", String(next.maxPrice));
  const qs = params.toString();
  return `/${locale}/products${qs ? `?${qs}` : ""}`;
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages(locale);
  return { title: messages.nav.products };
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
        {title}
      </h3>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors
                  ${active
                    ? "bg-amber-50 font-semibold text-amber-800"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"}`}
    >
      {active && (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
      )}
      {children}
    </Link>
  );
}

interface SidebarProps {
  locale: string;
  collections: Collection[];
  filters: SearchParams;
}

function Sidebar({ locale, collections, filters }: SidebarProps) {
  const noFilters = !filters.collection && !filters.minPrice && !filters.maxPrice;
  const activePriceKey = filters.minPrice || filters.maxPrice
    ? `${filters.minPrice ?? ""}-${filters.maxPrice ?? ""}`
    : null;

  return (
    <aside className="w-full shrink-0 space-y-8 lg:w-56">
      {/* Active filter summary + clear */}
      {!noFilters && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-stone-400">
            Filters
          </span>
          <Link
            href={`/${locale}/products`}
            className="text-xs font-medium text-stone-500 hover:text-stone-900"
          >
            Clear all
          </Link>
        </div>
      )}

      {/* Collections */}
      <FilterGroup title="Collection">
        <FilterLink
          href={buildHref(locale, filters, { collection: undefined })}
          active={!filters.collection}
        >
          All products
        </FilterLink>
        {collections.map((col) => (
          <FilterLink
            key={col.handle}
            href={buildHref(locale, filters, { collection: col.handle })}
            active={filters.collection === col.handle}
          >
            {col.title}
          </FilterLink>
        ))}
      </FilterGroup>

      {/* Price range */}
      <FilterGroup title="Price">
        <FilterLink
          href={buildHref(locale, filters, { minPrice: undefined, maxPrice: undefined })}
          active={!activePriceKey}
        >
          Any price
        </FilterLink>
        {PRICE_RANGES.map(({ label, min, max }) => {
          const key = `${min ?? ""}-${max ?? ""}`;
          return (
            <FilterLink
              key={key}
              href={buildHref(locale, filters, {
                minPrice: min !== undefined ? String(min) : undefined,
                maxPrice: max !== undefined ? String(max) : undefined,
              })}
              active={activePriceKey === key}
            >
              {label}
            </FilterLink>
          );
        })}
      </FilterGroup>
    </aside>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ locale }, filters] = await Promise.all([params, searchParams]);
  const messages = await getMessages(locale);

  const { collection, minPrice, maxPrice } = filters;

  // Build Storefront API price filter
  type PriceFilter = { price: { min?: number; max?: number } };
  const priceFilter: PriceFilter | null =
    minPrice || maxPrice
      ? { price: { min: minPrice ? parseFloat(minPrice) : undefined, max: maxPrice ? parseFloat(maxPrice) : undefined } }
      : null;

  // Parallel fetch: collections list + products
  const [collectionsData, productsData] = await Promise.all([
    storeFetch<CollectionsData>({
      query: COLLECTIONS_QUERY,
      variables: { first: 20 },
      cache: 300,
    }),
    collection
      ? storeFetch<CollectionData>({
          query: COLLECTION_BY_HANDLE_QUERY,
          variables: {
            handle: collection,
            first: 24,
            filters: priceFilter ? [priceFilter] : [],
          },
          cache: 60,
        })
      : storeFetch<ProductsData>({
          query: PRODUCTS_QUERY,
          variables: { first: 24 },
          cache: 60,
        }),
  ]);

  const collections =
    collectionsData.collections.edges.map((e) => e.node);

  // Normalise product list regardless of which query ran
  const products: Product[] =
    "collection" in productsData
      ? productsData.collection?.products.edges.map((e) => e.node) ?? []
      : productsData.products.edges.map((e) => e.node);

  const activeCollection = collection
    ? collections.find((c) => c.handle === collection)
    : null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          {activeCollection?.title ?? messages.nav.products}
        </h1>
        {products.length > 0 && (
          <p className="mt-1 text-sm text-stone-500">
            {products.length} product{products.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Sidebar */}
        <Sidebar locale={locale} collections={collections} filters={filters} />

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {products.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed
                            border-stone-200 py-24 text-center text-stone-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                strokeWidth={1} stroke="currentColor" className="h-12 w-12 text-stone-200">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0
                     1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504
                     1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621
                     0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
              </svg>
              <p className="text-sm">No products match these filters.</p>
              <Link
                href={`/${locale}/products`}
                className="text-sm font-medium text-amber-600 hover:text-amber-700"
              >
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  locale={locale}
                  messages={messages}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
