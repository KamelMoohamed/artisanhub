"use client";

import { usePathname, useRouter } from "next/navigation";
import { locales, i18nConfig, type Locale } from "@/lib/i18n/config";

interface LocaleSwitcherProps {
  currentLocale: Locale;
}

export function LocaleSwitcher({ currentLocale }: LocaleSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(next: Locale) {
    // Replace only the [locale] segment (index 1) and keep the rest of the path
    const segments = pathname.split("/");
    segments[1] = next;
    router.push(segments.join("/") || `/${next}`);
  }

  const current = i18nConfig[currentLocale];

  return (
    <div className="relative group">
      {/* Trigger */}
      <button
        aria-haspopup="listbox"
        aria-label={`Language: ${current.label}`}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium
                   text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
      >
        <span aria-hidden="true">{current.flag}</span>
        <span>{current.language}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3.5 w-3.5 opacity-50 transition-transform group-hover:rotate-180"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown list */}
      <ul
        role="listbox"
        aria-label="Select language"
        className="pointer-events-none absolute end-0 top-full z-50 mt-1.5 w-44
                   origin-top-end scale-95 rounded-xl border border-stone-200 bg-white
                   opacity-0 shadow-lg ring-1 ring-black/5 transition-all duration-150
                   group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100"
      >
        {locales.map((locale) => {
          const item = i18nConfig[locale];
          const active = locale === currentLocale;

          return (
            <li key={locale} role="option" aria-selected={active}>
              <button
                onClick={() => switchLocale(locale)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm text-start
                            first:rounded-t-xl last:rounded-b-xl transition-colors
                            ${active
                              ? "bg-amber-50 font-semibold text-amber-800"
                              : "text-stone-700 hover:bg-stone-50"}`}
              >
                {/* Flag */}
                <span aria-hidden="true" className="text-base leading-none">
                  {item.flag}
                </span>

                {/* Language name */}
                <span className="flex-1">{item.label}</span>

                {/* Active checkmark */}
                {active && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4 text-amber-600"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
