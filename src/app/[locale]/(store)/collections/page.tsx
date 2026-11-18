import { assertLocale } from "@/i18n/routing";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { FeaturedCollections } from "@/components/home/FeaturedCollections";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { getAllCollections } from "@/services/catalog-list";
import { mediaUrl } from "@/lib/media";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: AppLocale }> };

export const revalidate = 600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  assertLocale(locale);
  const t = await getTranslations({ locale, namespace: "catalog" });
  return { title: t("collections"), alternates: { canonical: `/${locale}/collections` } };
}

export default async function CollectionsPage({ params }: Props) {
  const { locale } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  const [t, th] = await Promise.all([getTranslations("catalog"), getTranslations("home")]);
  const items = (await getAllCollections(locale)).map((c) => ({ slug: c.slug, name: c.name, description: null, imageUrl: mediaUrl(c.imageKey) }));

  return (
    <>
      <SiteHeader />
      <main id="main" className="pb-8">
        <div className="page-x mx-auto max-w-[var(--container-page)]">
          <Breadcrumbs items={[{ name: t("home"), href: "/" }, { name: t("collections") }]} locale={locale} className="pt-6" />
        </div>
        {items.length > 0 ? (
          <FeaturedCollections title={t("collections")} explore={th("explore")} items={items} />
        ) : (
          <p className="page-x mx-auto mt-16 max-w-[var(--container-page)] text-muted">{t("empty")}</p>
        )}
      </main>
    </>
  );
}
