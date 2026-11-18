import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ProductCard } from "@/components/product/ProductCard";
import { WishlistButton } from "@/components/product/WishlistButton";
import { getSessionUser } from "@/features/auth/session";
import { cardInclude, toCard } from "@/services/catalog";
import { Link, assertLocale, type AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: AppLocale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  assertLocale(locale);
  const t = await getTranslations({ locale, namespace: "wishlist" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function WishlistPage({ params }: Props) {
  const { locale } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  const [t, user] = await Promise.all([getTranslations("wishlist"), getSessionUser()]);

  const items = user
    ? await prisma.wishlistItem.findMany({
        where: { wishlist: { userId: user.id }, product: { status: "ACTIVE" } },
        orderBy: { createdAt: "desc" },
        include: { product: { include: cardInclude(locale) } },
      })
    : [];

  return (
    <>
      <SiteHeader />
      <main id="main" className="page-x mx-auto max-w-[var(--container-page)] py-12 md:py-16">
        <h1 className="text-5xl md:text-6xl">{t("title")}</h1>

        {!user ? (
          <div className="mt-10 max-w-md border border-line bg-paper p-8">
            <p className="text-muted">{t("loginRequired")}</p>
            <Link href={`/account?next=${encodeURIComponent(`/${locale}/wishlist`)}`} className="btn btn-primary mt-6">{t("loginCta")}</Link>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <span className="h-12 w-px bg-accent" aria-hidden />
            <p className="mt-8 font-serif text-3xl">{t("empty")}</p>
            <p className="mt-3 max-w-sm text-muted">{t("emptyText")}</p>
            <Link href="/catalog" className="btn btn-primary mt-8">{t("browse")}</Link>
          </div>
        ) : (
          <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
            {items.map((i) => (
              <li key={i.productId} className="relative">
                <ProductCard product={toCard(i.product, locale)} />
                <div className="absolute right-1 top-1 rounded-full bg-paper/90">
                  <WishlistButton productId={i.productId} variant="icon" initial />
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
