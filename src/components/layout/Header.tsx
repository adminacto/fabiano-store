"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, type AppLocale } from "@/i18n/routing";
import { Logo } from "./Logo";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { CartCount } from "./CartCount";
import { BagIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/ui/icons";

const NAV = [
  { key: "newArrivals", href: "/catalog?new=1" },
  { key: "men", href: "/men" },
  { key: "women", href: "/women" },
  { key: "collections", href: "/collections" },
  { key: "sale", href: "/catalog?sale=1" },
] as const;

interface HeaderProps {
  /** Прозрачный header поверх hero (только главная, только когда есть фото в hero). */
  overlay?: boolean;
  logoUrl?: string | null;
  enabledLocales?: readonly AppLocale[];
  /** На главной без фото-баннера крупный логотип уже в hero — в прозрачной шапке не дублируем */
  hideLogoWhileTransparent?: boolean;
}

export function Header({ overlay = false, logoUrl, enabledLocales, hideLogoWhileTransparent = false }: HeaderProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!overlay) return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const transparent = overlay && !scrolled && !open;

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-cream focus:px-4 focus:py-2 focus:text-wine-deep">
        {t("skipToContent")}
      </a>
      <header
        className={`${overlay ? "fixed" : "sticky"} inset-x-0 top-0 z-50 transition-colors duration-500 ease-[var(--ease-fabiano)] ${
          transparent ? "bg-transparent text-cream" : "border-b border-white/10 bg-wine-deep/95 text-cream shadow-[0_1px_24px_rgb(0_0_0/0.25)] backdrop-blur-md"
        }`}
      >
        <div className="page-x mx-auto grid h-16 max-w-[var(--container-page)] grid-cols-[1fr_auto_1fr] items-center gap-4 md:h-20">
          {/* Слева: меню (mobile) / навигация (desktop) */}
          <div className="flex items-center">
            <button
              type="button"
              className="-ml-2 flex h-11 w-11 items-center justify-center xl:hidden"
              aria-label={open ? t("close") : t("menu")}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <CloseIcon /> : <MenuIcon />}
            </button>
            <nav aria-label={t("mainNav")} className="hidden xl:block">
              <ul className="flex items-center gap-7">
                {NAV.map((n) => (
                  <li key={n.key}>
                    <Link href={n.href} className={`eyebrow link-underline whitespace-nowrap pb-1 ${n.key === "sale" ? "text-champagne" : ""}`}>
                      {t(n.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className={`transition-opacity duration-500 ${transparent && hideLogoWhileTransparent ? "pointer-events-none opacity-0" : "opacity-100"}`}>
            <Logo logoUrl={logoUrl} />
          </div>

          {/* Справа: действия */}
          <div className="flex items-center justify-end gap-1 md:gap-2">
            <LocaleSwitcher enabled={enabledLocales} className="mr-3 hidden xl:flex" />
            <Link href="/search" aria-label={t("search")} className="flex h-11 w-11 items-center justify-center">
              <SearchIcon />
            </Link>
            <Link href="/account" aria-label={t("account")} className="hidden h-11 w-11 items-center justify-center md:flex">
              <UserIcon />
            </Link>
            <Link href="/wishlist" aria-label={t("wishlist")} className="hidden h-11 w-11 items-center justify-center md:flex">
              <HeartIcon />
            </Link>
            <Link href="/cart" aria-label={t("cart")} className="relative -mr-2 flex h-11 w-11 items-center justify-center">
              <BagIcon />
              <CartCount />
            </Link>
          </div>
        </div>
      </header>

      {/* Мобильное меню: полноэкранное, крупные области нажатия */}
      <div
        id="mobile-menu"
        hidden={!open}
        className="velvet fixed inset-0 top-16 z-40 overflow-y-auto text-cream md:top-20 xl:hidden"
      >
        <nav aria-label={t("menu")} className="page-x flex min-h-full flex-col pb-10 pt-6">
          <ul className="flex flex-col">
            {NAV.map((n) => (
              <li key={n.key} className="border-b border-white/10">
                <Link
                  href={n.href}
                  className={`flex min-h-16 items-center font-serif text-[2rem] leading-none ${n.key === "sale" ? "text-champagne" : ""}`}
                >
                  {t(n.key)}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-8 flex flex-col gap-1">
            <li>
              <Link href="/account" className="flex min-h-12 items-center gap-3 text-sm"><UserIcon width={20} height={20} />{t("account")}</Link>
            </li>
            <li>
              <Link href="/wishlist" className="flex min-h-12 items-center gap-3 text-sm"><HeartIcon width={20} height={20} />{t("wishlist")}</Link>
            </li>
          </ul>
          <LocaleSwitcher enabled={enabledLocales} className="mt-auto pt-10" />
        </nav>
      </div>
    </>
  );
}
