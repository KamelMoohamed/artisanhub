import { Money } from "@/components/ui/Money";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/getMessages";
import type { Product } from "@/lib/shopify/types";
import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "./AddToCartButton";

interface ProductCardProps {
  product: Product;
  locale: Locale;
  messages: Messages;
}

export function ProductCard({ product, locale, messages }: ProductCardProps) {
  const {
    handle,
    title,
    vendor,
    featuredImage,
    priceRange,
    variants,
    tags,
  } = product;

  const href = `/${locale}/products/${handle}`;

  // First variant — needed for Add to Cart. Only available when
  // variants are fetched (e.g. product detail page or enriched list query).
  const firstVariant = variants?.edges[0]?.node;
  const isFragile = tags.includes("fragile");

  return (
    <article className="group flex flex-col rounded-2xl border border-stone-100 bg-white
                        shadow-sm transition-shadow hover:shadow-md overflow-hidden">
      {/* ── Image ── */}
      <Link href={href} aria-label={title} className="relative block aspect-square overflow-hidden bg-stone-50">
        {featuredImage ? (
          <Image
            src={featuredImage.url}
            alt={featuredImage.altText ?? title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          // Placeholder when no image is available
          <span className="flex h-full w-full items-center justify-center text-stone-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={1} stroke="currentColor" className="h-12 w-12">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5
                   1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 18h16.5M3.75
                   3.75h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75
                   A2.25 2.25 0 0 1 1.5 18V6A2.25 2.25 0 0 1 3.75 3.75Z" />
            </svg>
          </span>
        )}

        {/* Fragile badge */}
        {isFragile && (
          <span
            className="absolute start-2 top-2 rounded-full bg-amber-100 px-2 py-0.5
                       text-[11px] font-semibold text-amber-800"
          >
            Fragile
          </span>
        )}
      </Link>

      {/* ── Body ── */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Vendor */}
        <p className="text-xs font-medium uppercase tracking-wide text-amber-600">
          {messages.product.by} {vendor}
        </p>

        {/* Title */}
        <Link href={href} className="flex-1">
          <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-stone-800
                         hover:text-stone-600 transition-colors">
            {title}
          </h2>
        </Link>

        {/* Price + CTA */}
        <div className="flex items-center justify-between gap-2">
          <Money
            data={priceRange.minVariantPrice}
            locale={locale}
            className="text-base font-bold text-stone-900"
          />

          {firstVariant ? (
            <div className="w-36 shrink-0">
              <AddToCartButton
                variantId={firstVariant.id}
                available={firstVariant.availableForSale}
                label={messages.product.addToCart}
                outOfStockLabel={messages.product.outOfStock}
              />
            </div>
          ) : (
            // Variants not loaded — navigate to product page instead
            <Link
              href={href}
              className="flex h-10 shrink-0 items-center justify-center rounded-full
                         bg-stone-900 px-5 text-sm font-medium text-white
                         transition-colors hover:bg-stone-700"
            >
              {messages.product.addToCart}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
