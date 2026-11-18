import { assertLocale } from "@/i18n/routing";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CartClient } from "@/components/cart/CartClient";
import { getCartView } from "@/services/cart";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: AppLocale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  assertLocale(locale);
  const t = await getTranslations({ locale, namespace: "cart" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function CartPage({ params }: Props) {
  const { locale } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  const cart = await getCartView(locale);
  return (
    <>
      <SiteHeader />
      <main id="main" className="page-x mx-auto max-w-[var(--container-page)] pb-28 lg:pb-8">
        <CartClient initial={cart} />
      </main>
    </>
  );
}
