import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";

interface FooterProps {
  locale: Locale;
}

const quickLinks = [
  { label: "Products", href: "products" },
  { label: "Vendors", href: "vendors" },
];

export function Footer({ locale }: FooterProps) {
  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-stone-900">
              <span className="text-amber-600">✦</span>
              ArtisanHub
            </div>
            <p className="text-sm leading-relaxed text-stone-500 max-w-xs">
              Handcrafted goods from independent artisans around the world.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">
              Explore
            </h3>
            <ul className="space-y-2">
              {quickLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={`/${locale}/${href}`}
                    className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">
              Legal
            </h3>
            <ul className="space-y-2">
              {["Privacy Policy", "Terms of Service"].map((label) => (
                <li key={label}>
                  <span className="text-sm text-stone-400">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-stone-200 pt-6 flex items-center justify-between text-xs text-stone-400">
          <span>© {new Date().getFullYear()} ArtisanHub. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
