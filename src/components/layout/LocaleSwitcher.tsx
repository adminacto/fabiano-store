"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter, locales, type AppLocale } from "@/i18n/routing";

const LABEL: Record<AppLocale, string> = { uz: "UZ", ru: "RU", en: "EN" };

export function LocaleSwitcher({ enabled = locales, className = "" }: { enabled?: readonly AppLocale[]; className?: string }) {
  const t = useTranslations("nav");
  const current = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div role="group" aria-label={t("language")} className={`flex items-center gap-3 ${className}`}>
      {enabled.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={l === current}
          disabled={pending}
          onClick={() => startTransition(() => router.replace(pathname, { locale: l }))}
          className={`text-[0.6875rem] font-semibold tracking-[0.18em] transition-opacity ${
            l === current ? "opacity-100" : "opacity-50 hover:opacity-100"
          }`}
        >
          {LABEL[l]}
        </button>
      ))}
    </div>
  );
}
