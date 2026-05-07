import { ProductGallery } from "@/components/product/ProductGallery";
import { VariantSelector } from "@/components/product/VariantSelector";
import { locales, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/getMessages";
import { storeFetch } from "@/lib/shopify/client";
import {
  PRODUCT_BY_HANDLE_QUERY,
  PRODUCT_HANDLES_QUERY,
} from "@/lib/shopify/queries/products";
import { VENDOR_PROFILE_BY_HANDLE_QUERY } from "@/lib/shopify/queries/vendors";
import type { Product, VendorProfile } from "@/lib/shopify/types";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductData {
  product: Product | null;
}

interface VendorData {
  metaobjectByHandle: VendorProfile | null;
}

interface HandlesData {
  products: { edges: { node: { handle: string } }[] };
}

// ─── Helper: extract a field value from VendorProfile ─────────────────────────

function vendorField(profile: VendorProfile, key: string): string {
  return profile.fields.find((f) => f.key === key)?.value ?? "";
}

// ─── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const data = await storeFetch<HandlesData>({
    query: PRODUCT_HANDLES_QUERY,
    variables: { first: 250 },
    cache: 3600, // Re-fetch handles at most once per hour
  });

  const handles = data.products.edges.map((e) => e.node.handle);

  // One static page per locale × handle combination
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

  const data = await storeFetch<ProductData>({
    query: PRODUCT_BY_HANDLE_QUERY,
    variables: { handle },
    cache: 60,
  });

  const product = data.product;
  if (!product) return {};

  const description = product.descriptionHtml
    ? product.descriptionHtml.replace(/<[^>]+>/g, "").slice(0, 155)
    : undefined;

  return {
    title: product.title,
    description,
    openGraph: {
      title: product.title,
      description,
      images: product.featuredImage
        ? [{ url: product.featuredImage.url, alt: product.featuredImage.altText ?? product.title }]
        : undefined,
    },
  };
}

// ─── Vendor card ──────────────────────────────────────────────────────────────

function VendorCard({
  profile,
  locale,
  messages,
}: {
  profile: VendorProfile;
  locale: Locale;
  messages: Awaited<ReturnType<typeof getMessages>>;
}) {
  const name     = vendorField(profile, "name")         || profile.handle;
  const bio      = vendorField(profile, "bio");
  const country  = vendorField(profile, "country");
  const founded  = vendorField(profile, "founded_year");
  const shipping = vendorField(profile, "shipping_note");

  return (
    <aside className="rounded-2xl border border-stone-100 bg-stone-50 p-6">
      <div className="flex items-start justify-between gap-4">
        {/* Avatar placeholder */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center
                        rounded-full bg-amber-100 text-lg font-bold text-amber-700">
          {name.charAt(0).toUpperCase()}
        </div>

        <Link
          href={`/${locale}/vendors/${profile.handle}`}
          className="text-xs font-medium text-amber-600 hover:text-amber-700"
        >
          View shop →
        </Link>
      </div>

      <div className="mt-4 space-y-1">
        <p className="text-sm font-semibold text-stone-900">{name}</p>

        {(country || founded) && (
          <p className="text-xs text-stone-500">
            {country && <span>{messages.vendor.from} {country}</span>}
            {country && founded && <span className="mx-1.5">·</span>}
            {founded && <span>{messages.vendor.founded} {founded}</span>}
          </p>
        )}
      </div>

      {bio && (
        <p className="mt-3 text-sm leading-relaxed text-stone-600 line-clamp-3">
          {bio}
        </p>
      )}

      {shipping && (
        <p className="mt-4 flex gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          <span aria-hidden="true">📦</span>
          {shipping}
        </p>
      )}
    </aside>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; handle: string }>;
}) {
  const { locale, handle } = await params;
  const messages = await getMessages(locale);

  const productData = await storeFetch<ProductData>({
    query: PRODUCT_BY_HANDLE_QUERY,
    variables: { handle },
    cache: 60,
  });

  const product = productData.product;
  if (!product) notFound();

  // Fetch linked vendor profile in parallel (non-blocking: null if missing)
  const vendorId = product.metafield?.value ?? null;
  const vendorProfile = vendorId
    ? await storeFetch<VendorData>({
        query: VENDOR_PROFILE_BY_HANDLE_QUERY,
        variables: {
          handle: { handle: vendorId, type: "$app:vendor_profile" },
        },
        cache: 300,
      }).then((d) => d.metaobjectByHandle)
    : null;

  const images = product.images?.edges.map((e) => e.node) ?? (
    product.featuredImage ? [product.featuredImage] : []
  );

  const variants = product.variants?.edges.map((e) => e.node) ?? [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-1.5 text-sm text-stone-400">
        <Link href={`/${locale}`} className="hover:text-stone-600">Home</Link>
        <span>/</span>
        <Link href={`/${locale}/products`} className="hover:text-stone-600">
          {messages.nav.products}
        </Link>
        <span>/</span>
        <span className="truncate text-stone-700">{product.title}</span>
      </nav>

      {/* Main product grid */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">

        {/* Left — gallery */}
        <ProductGallery images={images} title={product.title} />

        {/* Right — details */}
        <div className="flex flex-col gap-6">
          {/* Vendor / brand */}
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">
            {messages.product.by} {product.vendor}
          </p>

          {/* Title */}
          <h1 className="text-2xl font-bold leading-snug tracking-tight text-stone-900
                         sm:text-3xl">
            {product.title}
          </h1>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium
                              ${tag === "fragile"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-stone-100 text-stone-600"}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Variant selector + add-to-cart (client) */}
          {variants.length > 0 ? (
            <VariantSelector
              variants={variants}
              locale={locale}
              messages={messages}
            />
          ) : (
            <p className="text-sm text-stone-400">No variants available</p>
          )}

          {/* Divider */}
          <hr className="border-stone-100" />

          {/* Description */}
          {product.descriptionHtml && (
            <div
              className="prose prose-sm prose-stone max-w-none
                         prose-headings:font-semibold prose-a:text-amber-600"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          )}
        </div>
      </div>

      {/* Vendor card */}
      {vendorProfile && (
        <div className="mt-14 max-w-md">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-stone-400">
            About the maker
          </h2>
          <VendorCard
            profile={vendorProfile}
            locale={locale}
            messages={messages}
          />
        </div>
      )}
    </div>
  );
}
