import type { Metadata, Viewport } from "next";
import { serif, sans } from "@/lib/fonts";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: { default: "FABIANO Admin", template: "%s — FABIANO Admin" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#3A0A13" };

/** Отдельный корневой layout админки: свой язык (русский), без витринной навигации и без индексации. */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${serif.variable} ${sans.variable}`}>
      <body className="min-h-svh bg-canvas text-ink">{children}</body>
    </html>
  );
}
