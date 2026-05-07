import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/getMessages";
import { CartPageClient } from "./CartPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages(locale);
  return { title: messages.cart.title };
}

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const messages = await getMessages(locale);

  // CartPageClient is a "use client" component — it reads live cart state
  // from useCart() (hydrogen-react). Locale + messages are passed from the
  // server so the client never needs to re-fetch them.
  return <CartPageClient locale={locale} messages={messages} />;
}
