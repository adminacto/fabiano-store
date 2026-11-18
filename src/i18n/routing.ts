import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const locales = ["uz", "ru", "en"] as const;
export type AppLocale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "uz",
  localePrefix: "always",
});

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

export function isLocale(v: string): v is AppLocale {
  return (locales as readonly string[]).includes(v);
}
