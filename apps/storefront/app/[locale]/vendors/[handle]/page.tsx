import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { locales, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/getMessages";
import { storeFetch } from "@/lib/shopify/client";
import {
  VENDOR_HANDLES_QUERY,
  VENDOR_PROFILE_BY_HANDLE_QUERY,
} from "@/lib/shopify/queries/vendors";
import { PRODUCTS_QUERY } from "@/lib/shopify/queries/products";
import type { Product, VendorProfile, VendorProfileField } from "@/lib/shopify/types";
import { ProductCard } from "@/components/product/ProductCard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VendorData {
  metaobjectByHandle: VendorProfile | null;
}

interface VendorHandlesData {
  metaobjects: { edges: { node: { handle: string } }[] };
}

interface ProductsData {
  products: { edges: { node: Product }[] };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function field(fields: VendorProfileField[], key: string) {
  return fields.find((f) => f.key === key) ?? null;
}

function fieldValue(fields: VendorProfileField[], key: string): string {
  return field(fields, key)?.value ?? "";
}

// ─── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const data = await storeFetch<VendorHandlesData>({
    query: VENDOR_HANDLES_QUERY,
    variables: { first: 250 },
    cache: 3600,
  });

  const handles = data.metaobjects.edges.map((e) => e.node.handle);

  return locales.flatMap((locale) =>
    handles.map((handle) => ({ locale, handle })),
  );
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;

  const data = await storeFetch<VendorData>({
    query: VENDOR_PROFILE_BY_HANDLE_QUERY,
    variables: { handle: { handle, type: "$app:vendor_profile" } },
    cache: 300,
  });

  const profile = data.metaobjectByHandle;
  if (!profile) return {};

  const name = fieldValue(profile.fields, "name") || handle;
  const bio  = fieldValue(profile.fields, "bio");

  return {
    title: name,
    description: bio || `Shop handcrafted goods by ${name} on ArtisanHub.`,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function VendorProfilePage({
  params,
}: {
  params: Promise<{ locale: Locale; handle: string }>;
}) {
  const { locale, handle } = await params;
  const messages = await getMessages(locale);

  // Fetch vendor profile + their products in parallel
  const [vendorData, productsData] = await Promise.all([
    storeFetch<VendorData>({
      query: VENDOR_PROFILE_BY_HANDLE_QUERY,
      variables: { handle: { handle, type: "$app:vendor_profile" } },
      cache: 300,
    }),
    storeFetch<ProductsData>({
      query: PRODUCTS_QUERY,
      variables: {
        first: 50,
        filters: [
          {
            productMetafield: {
              namespace: "artisanhub",
              key: "vendor_id",
              value: handle,
            },
          },
        ],
      },
      cache: 60,
    }),
  ]);

  const profile = vendorData.metaobjectByHandle;
  if (!profile) notFound();

  const products = productsData.products.edges.map((e) => e.node);
  const { fields } = profile;

  // Resolved field values
  const name         = fieldValue(fields, "name")          || handle;
  const bio          = fieldValue(fields, "bio");
  const country      = fieldValue(fields, "country");
  const founded      = fieldValue(fields, "founded_year");
  const shippingNote = fieldValue(fields, "shipping_note");
  const email        = fieldValue(fields, "email");

  // Logo — resolved via MediaImage reference on the logo field
  const logoRef   = field(fields, "logo");
  const logoImage = logoRef?.reference?.image ?? null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb"
        className="mb-10 flex items-center gap-1.5 text-sm text-stone-400">
        <Link href={`/${locale}`} className="hover:text-stone-600">Home</Link>
        <span>/</span>
        <Link href={`/${locale}/vendors`} className="hover:text-stone-600">
          {messages.nav.vendors}
        </Link>
        <span>/</span>
        <span className="truncate text-stone-700">{name}</span>
      </nav>

      {/* ── Vendor hero ── */}
      <section className="mb-14 flex flex-col gap-8 sm:flex-row sm:items-start">

        {/* Logo / avatar */}
        <div className="shrink-0">
          {logoImage ? (
            <div className="relative h-28 w-28 overflow-hidden rounded-2xl border
                            border-stone-100 bg-stone-50 shadow-sm">
              <Image
                src={logoImage.url}
                alt={logoImage.altText ?? name}
                fill
                sizes="112px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-2xl
                            bg-amber-100 text-4xl font-bold text-amber-700 shadow-sm">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info block */}
        <div className="flex flex-1 flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              {name}
            </h1>

            {/* Meta row */}
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-stone-500">
              {country && (
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                    strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  {messages.vendor.from} {country}
                </span>
              )}
              {founded && (
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                    strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25
                         2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0
                         21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21
                         11.25v7.5" />
                  </svg>
                  {messages.vendor.founded} {founded}
                </span>
              )}
              {products.length > 0 && (
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                    strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0
                         0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621
                         0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621
                         0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                  </svg>
                  {products.length} {products.length === 1 ? "product" : "products"}
                </span>
              )}
            </div>
          </div>

          {/* Bio */}
          {bio && (
            <p className="max-w-2xl text-base leading-relaxed text-stone-600">
              {bio}
            </p>
          )}

          {/* Shipping note */}
          {shippingNote && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3
                            text-sm text-amber-800 max-w-lg">
              <span aria-hidden="true" className="shrink-0 text-base">📦</span>
              {shippingNote}
            </div>
          )}

          {/* Email (shown as contact hint, not linked to avoid spam) */}
          {email && (
            <p className="text-xs text-stone-400">
              Contact:{" "}
              <a
                href={`mailto:${email}`}
                className="text-stone-500 hover:text-stone-800 underline"
              >
                {email}
              </a>
            </p>
          )}
        </div>
      </section>

      {/* ── Products grid ── */}
      <section>
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-stone-400">
          {messages.vendor.products}
        </h2>

        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed
                          border-stone-200 py-20 text-center text-stone-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={1} stroke="currentColor" className="h-12 w-12 text-stone-200">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0
                   1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504
                   1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125
                   1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
            <p className="text-sm">No products listed yet.</p>
          </div>
        ) : (
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
        )}
      </section>
    </div>
  );
}
