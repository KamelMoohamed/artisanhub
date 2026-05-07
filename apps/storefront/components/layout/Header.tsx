import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { i18nConfig } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/getMessages";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { CartWidget } from "./CartWidget";

interface HeaderProps {
  locale: Locale;
  messages: Messages;
}

export function Header({ locale, messages }: HeaderProps) {
  const { currency } = i18nConfig[locale];

  const navLinks = [
    { label: messages.nav.home, href: `/${locale}` },
    { label: messages.nav.products, href: `/${locale}/products` },
    { label: messages.nav.vendors, href: `/${locale}/vendors` },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">

        {/* ── Logo ── */}
        <Link
          href={`/${locale}`}
          className="flex shrink-0 items-center gap-2 font-bold tracking-tight text-stone-900"
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg
                       bg-amber-500 text-sm font-black text-white"
            aria-hidden="true"
          >
            A
          </span>
          <span className="text-base">ArtisanHub</span>
        </Link>

        {/* ── Primary nav ── */}
        <nav aria-label="Main navigation" className="hidden flex-1 md:flex">
          <ul className="flex items-center gap-0.5">
            {navLinks.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="rounded-full px-3.5 py-1.5 text-sm font-medium text-stone-600
                             transition-colors hover:bg-stone-100 hover:text-stone-900"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Right controls ── */}
        <div className="flex items-center gap-1 ms-auto">

          {/* Currency badge — shows active locale's currency code */}
          <span
            className="hidden rounded-full border border-stone-200 px-2.5 py-1
                       text-xs font-semibold tracking-wide text-stone-500 sm:inline-block"
            title="Active currency"
          >
            {currency}
          </span>

          <LocaleSwitcher currentLocale={locale} />

          {/* Cart button: count badge + subtotal via <Money> */}
          <CartWidget label={messages.nav.cart} />
        </div>
      </div>
    </header>
  );
}
