"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LANGUAGES, LOCALE_COOKIE } from "@/i18n/config";
import type { Locale } from "@/i18n/config";
import { useLocale } from "next-intl";
import Flags from "country-flag-icons/react/3x2";

const LOCALE_TO_COUNTRY: Record<string, string> = {
  ar: "SA",
  bg: "BG",
  bn: "BD",
  cs: "CZ",
  da: "DK",
  de: "DE",
  en: "US",
  es: "ES",
  fa: "IR",
  fi: "FI",
  fr: "FR",
  gu: "IN",
  he: "IL",
  hi: "IN",
  hu: "HU",
  id: "ID",
  in: "ID",
  it: "IT",
  ja: "JP",
  ko: "KR",
  mr: "IN",
  ms: "MY",
  nl: "NL",
  no: "NO",
  phi: "PH",
  pl: "PL",
  pt: "PT",
  "pt-BR": "BR",
  ro: "RO",
  ru: "RU",
  sk: "SK",
  sv: "SE",
  sw: "KE",
  ta: "IN",
  te: "IN",
  th: "TH",
  tr: "TR",
  "uk-UA": "UA",
  ur: "PK",
  vi: "VN",
  "zh-CN": "CN",
};

function FlagIcon({ locale, className }: { locale: string; className?: string }) {
  const cc = LOCALE_TO_COUNTRY[locale];
  const Comp = cc
    ? (Flags as Record<string, React.ComponentType<{ className?: string }>>)[cc]
    : null;
  if (Comp) return <Comp className={className ?? "w-5 h-3.5 rounded-sm"} />;
  return <span className="text-base leading-none">🌐</span>;
}

/** Persist locale preference in cookie + localStorage (outside component scope for ESLint) */
function persistLocale(code: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${code};path=/;max-age=${365 * 24 * 60 * 60};samesite=lax`;
  try {
    localStorage.setItem(LOCALE_COOKIE, code);
  } catch {
    // Ignore
  }
}

export default function LanguageSelector() {
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (code: Locale) => {
    if (code === locale) {
      setOpen(false);
      return;
    }

    persistLocale(code);
    setOpen(false);
    router.refresh();
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-text-main hover:bg-surface-hover transition-all border border-transparent hover:border-border"
        title={currentLang.name}
      >
        <FlagIcon locale={currentLang.code} className="w-5 h-3.5 rounded-sm" />
        <span className="text-xs font-semibold tracking-wide">{currentLang.label}</span>
        <span
          className={`material-symbols-outlined text-[14px] text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          expand_more
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 max-h-80 rounded-xl border border-border bg-bg shadow-xl z-50 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                lang.code === locale
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-text-main hover:bg-surface-hover"
              }`}
            >
              <FlagIcon locale={lang.code} className="w-5 h-3.5 rounded-sm shrink-0" />
              <span className="flex-1 text-left">{lang.name}</span>
              {lang.code === locale && (
                <span className="material-symbols-outlined text-[16px] text-primary">check</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
