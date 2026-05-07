import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { notFound } from "next/navigation";
import { locales, i18nConfig, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/getMessages";
import { ShopifyCartProvider } from "@/components/ShopifyCartProvider";
import { CartDrawerProvider } from "@/components/cart/CartDrawerContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/Footer";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: { default: "ArtisanHub", template: "%s | ArtisanHub" },
    description: "Handcrafted goods from independent artisans around the world.",
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    ),
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [i18nConfig[l].language, `/${l}`])
      ),
    },
    openGraph: { locale },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale)) notFound();

  const config = i18nConfig[locale];
  const messages = await getMessages(locale);

  return (
    <html
      lang={locale}
      dir={config.direction}
      className={`${geist.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white font-sans text-stone-900">
        <ShopifyCartProvider
          countryIsoCode={config.countryCode}
          languageIsoCode={config.language}
        >
          <CartDrawerProvider>
            <Header locale={locale} messages={messages} />
            <main className="flex-1">{children}</main>
            <Footer locale={locale} />
            <CartDrawer locale={locale} messages={messages} />
          </CartDrawerProvider>
        </ShopifyCartProvider>
      </body>
    </html>
  );
}
