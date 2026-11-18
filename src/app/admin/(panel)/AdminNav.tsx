"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/products", label: "Товары" },
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/customers", label: "Клиенты" },
  { href: "/admin/coupons", label: "Промокоды" },
  { href: "/admin/settings", label: "Настройки" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Админ-меню" className="overflow-x-auto [scrollbar-width:none] lg:flex-1 lg:overflow-visible">
      <ul className="flex gap-1 px-3 pb-3 lg:flex-col lg:px-3 lg:pb-0">
        {ITEMS.map((i) => {
          const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={`block whitespace-nowrap px-3 py-2.5 text-sm transition-colors lg:px-4 ${active ? "bg-cream text-wine-deep" : "text-cream/80 hover:bg-white/10 hover:text-cream"}`}
              >
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
