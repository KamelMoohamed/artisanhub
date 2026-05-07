import { ProductCard } from "@/components/product/ProductCard";
import { locales, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/getMessages";
import { storeFetch } from "@/lib/shopify/client";
import { FEATURED_COLLECTION_QUERY } from "@/lib/shopify/queries/products";
import type { Collection, Product } from "@/lib/shopify/types";
import type { Metadata } from "next";
import Link from "next/link";

// Tell Next.js to pre-render one static page per locale
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages(locale);
  return {
    title: "ArtisanHub — Handcrafted Goods from Independent Artisans",
    description: messages.nav.products,
  };
}

interface FeaturedCollectionData {
  collection: (Collection & {
    products: { edges: { node: Product }[] };
  }) | null;
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const messages = await getMessages(locale);

  // Fetch featured collection — ISR revalidates every 60 s
  const data = await storeFetch<FeaturedCollectionData>({
    query: FEATURED_COLLECTION_QUERY,
    cache: 60,
  });

  const products =
    data.collection?.products.edges.map((e) => e.node) ?? [];

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-stone-950 text-white">
        {/* Decorative grain overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(217,119,6,0.25),transparent)]"
        />

        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-8
                        px-4 py-28 text-center sm:px-6 lg:px-8 lg:py-36">
          {/* Eyebrow */}
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10
                           bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest
                           text-amber-400">
            <span aria-hidden="true">✦</span>
            Handcrafted with care
          </span>

          {/* Headline */}
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight
                         sm:text-5xl lg:text-6xl">
            Discover goods made by the{" "}
            <span className="text-amber-400">world&apos;s best artisans</span>
          </h1>

          {/* Sub-headline */}
          <p className="max-w-xl text-base leading-relaxed text-stone-400 sm:text-lg">
            From Egyptian ceramics to French linen — every piece on ArtisanHub
            is made by hand and shipped directly from the maker to you.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href={`/${locale}/products`}
              className="flex h-12 items-center gap-2 rounded-full bg-amber-500 px-7
                         text-sm font-semibold text-white transition-colors hover:bg-amber-400"
            >
              {messages.nav.products}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5
                     5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75
                     A.75.75 0 0 1 3 10Z" />
              </svg>
            </Link>
            <Link
              href={`/${locale}/vendors`}
              className="flex h-12 items-center rounded-full border border-white/15 px-7
                         text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              {messages.nav.vendors}
            </Link>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-8 pt-4 text-xs
                          font-medium tracking-wide text-stone-500">
            {[
              ["🌍", "3 countries"],
              ["🧑‍🎨", "Independent artisans"],
              ["📦", "Ships worldwide"],
            ].map(([icon, label]) => (
              <span key={label} className="flex items-center gap-1.5">
                <span aria-hidden="true">{icon}</span>
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured products ── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        {/* Section header */}
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-amber-600">
              Featured
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              {data.collection?.title ?? "Featured Collection"}
            </h2>
          </div>
          <Link
            href={`/${locale}/products`}
            className="hidden shrink-0 items-center gap-1 text-sm font-medium text-stone-500
                       transition-colors hover:text-stone-900 sm:flex"
          >
            View all
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
              fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd"
                d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5
                   5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75
                   A.75.75 0 0 1 3 10Z" />
            </svg>
          </Link>
        </div>

        {products.length === 0 ? (
          // Empty state — collection not seeded yet
          <div className="flex flex-col items-center gap-3 py-20 text-center text-stone-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={1} stroke="currentColor" className="h-14 w-14 text-stone-200">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0
                   1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504
                   1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621
                   0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
            <p className="text-sm">
              No products yet — run the seed script to populate the store.
            </p>
            <code className="mt-1 rounded bg-stone-100 px-2 py-1 text-xs text-stone-600">
              npm run seed
            </code>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* Mobile "view all" link */}
        {products.length > 0 && (
          <div className="mt-10 text-center sm:hidden">
            <Link
              href={`/${locale}/products`}
              className="inline-flex items-center gap-1 text-sm font-medium text-stone-600
                         transition-colors hover:text-stone-900"
            >
              View all products
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5
                     5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75
                     A.75.75 0 0 1 3 10Z" />
              </svg>
            </Link>
          </div>
        )}
      </section>

      {/* ── Category teaser ── */}
      <section className="bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-xl font-bold tracking-tight text-stone-900">
            Shop by craft
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { emoji: "🏺", label: "Ceramics", q: "Ceramics" },
              { emoji: "🧵", label: "Textiles", q: "Textiles" },
              { emoji: "👜", label: "Leather", q: "Leather" },
            ].map(({ emoji, label, q }) => (
              <Link
                key={q}
                href={`/${locale}/products?collection=${q.toLowerCase()}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border
                           border-stone-200 bg-white p-8 text-center transition-shadow
                           hover:shadow-md"
              >
                <span className="text-4xl" aria-hidden="true">{emoji}</span>
                <span className="text-sm font-semibold text-stone-700 group-hover:text-stone-900">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
