import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/getMessages";
import { storeFetch } from "@/lib/shopify/client";
import { VENDOR_PROFILES_QUERY } from "@/lib/shopify/queries/vendors";
import type { VendorProfile, VendorProfileField } from "@/lib/shopify/types";

interface VendorsData {
  metaobjects: { edges: { node: VendorProfile }[] };
}

function fieldValue(fields: VendorProfileField[], key: string): string {
  return fields.find((f) => f.key === key)?.value ?? "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages(locale);
  return { title: messages.nav.vendors };
}

export default async function VendorsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const messages = await getMessages(locale);

  const data = await storeFetch<VendorsData>({
    query: VENDOR_PROFILES_QUERY,
    variables: { first: 50 },
    cache: 300,
  });

  const vendors = data.metaobjects.edges.map((e) => e.node);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
        {messages.nav.vendors}
      </h1>
      <p className="mb-10 text-sm text-stone-500">
        {vendors.length} independent maker{vendors.length !== 1 ? "s" : ""}
      </p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor) => {
          const name         = fieldValue(vendor.fields, "name") || vendor.handle;
          const bio          = fieldValue(vendor.fields, "bio");
          const country      = fieldValue(vendor.fields, "country");
          const logoField    = vendor.fields.find((f) => f.key === "logo");
          const logoImage    = logoField?.reference?.image ?? null;

          return (
            <Link
              key={vendor.handle}
              href={`/${locale}/vendors/${vendor.handle}`}
              className="group flex gap-4 rounded-2xl border border-stone-100 bg-white
                         p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Logo / avatar */}
              {logoImage ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl
                                border border-stone-100 bg-stone-50">
                  <Image
                    src={logoImage.url}
                    alt={logoImage.altText ?? name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center
                                rounded-xl bg-amber-100 text-xl font-bold text-amber-700">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate font-semibold text-stone-900
                               group-hover:text-amber-700 transition-colors">
                  {name}
                </p>
                {country && (
                  <p className="mt-0.5 text-xs text-stone-500">{country}</p>
                )}
                {bio && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-stone-500">
                    {bio}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
