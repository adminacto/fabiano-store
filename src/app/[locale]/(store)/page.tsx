import { assertLocale } from "@/i18n/routing";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Hero } from "@/components/home/Hero";
import { GenderTiles } from "@/components/home/GenderTiles";
import { ProductRail, ProductRailSkeleton } from "@/components/home/ProductRail";
import { FeaturedCollections } from "@/components/home/FeaturedCollections";
import { BrandSection } from "@/components/home/BrandSection";
import { NewsletterForm } from "@/components/home/NewsletterForm";
import { getActiveHero, getBestSellers, getFeaturedCollections, getNewArrivals } from "@/services/catalog";
import type { AppLocale } from "@/i18n/routing";

// ISR: главная пересобирается раз в 5 минут; изменения из Dashboard дополнительно сбрасывают кэш через revalidatePath.
export const revalidate = 300;

export default async function HomePage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tn = await getTranslations("newsletter");
  const hero = await getActiveHero(locale);

  return (
    <>
      <SiteHeader overlay hideLogoWhileTransparent={!hero?.imageUrl} />
      <main id="main">
        <Hero data={hero} />
        <GenderTiles />

        <Suspense fallback={<ProductRailSkeleton />}>
          <NewArrivals locale={locale} title={t("newArrivals")} viewAll={t("viewAll")} empty={t("emptyProducts")} />
        </Suspense>

        <Suspense fallback={null}>
          <Collections locale={locale} title={t("collections")} explore={t("explore")} />
        </Suspense>

        <Suspense fallback={<ProductRailSkeleton />}>
          <BestSellers locale={locale} title={t("bestSellers")} viewAll={t("viewAll")} />
        </Suspense>

        <BrandSection title={t("brandTitle")} text={t("brandText")} />

        <section className="page-x mx-auto mt-24 max-w-[var(--container-page)] md:mt-32">
          <div className="velvet on-dark grid gap-8 px-6 py-14 text-cream md:grid-cols-2 md:items-end md:px-14 md:py-20">
            <div>
              <h2 className="text-4xl md:text-5xl">{tn("title")}</h2>
              <p className="mt-4 max-w-md text-sm text-cream/70">{tn("text")}</p>
            </div>
            <NewsletterForm source="home" />
          </div>
        </section>
      </main>
    </>
  );
}

async function NewArrivals({ locale, title, viewAll, empty }: { locale: AppLocale; title: string; viewAll: string; empty: string }) {
  const products = await getNewArrivals(locale);
  return <ProductRail title={title} href="/catalog?new=1" viewAll={viewAll} products={products} emptyText={empty} />;
}

async function BestSellers({ locale, title, viewAll }: { locale: AppLocale; title: string; viewAll: string }) {
  const products = await getBestSellers(locale);
  // Бестселлеры появляются только после реальных продаж — без продаж секция скрыта, а не заполнена выдуманными данными.
  if (products.length === 0) return null;
  return <ProductRail title={title} href="/catalog?sort=best" viewAll={viewAll} products={products} emptyText="" />;
}

async function Collections({ locale, title, explore }: { locale: AppLocale; title: string; explore: string }) {
  const items = await getFeaturedCollections(locale);
  return <FeaturedCollections title={title} explore={explore} items={items} />;
}
