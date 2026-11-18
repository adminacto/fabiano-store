import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CatalogView } from "@/components/catalog/CatalogView";
import { parseCatalogFilters } from "@/features/catalog/filters";
import { listProducts } from "@/services/catalog-list";
import type { SearchParams } from "@/features/catalog/pages";
import type { AppLocale } from "@/i18n/routing";
import { SearchIcon } from "@/components/ui/icons";

type Props = { params: Promise<{ locale: AppLocale }>; searchParams: SearchParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalog" });
  return { title: t("searchTitle"), robots: { index: false, follow: true } };
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("catalog");
  const filters = parseCatalogFilters(await searchParams);

  const form = (
    <form method="get" action={`/${locale}/search`} role="search" className="page-x mx-auto max-w-[var(--container-page)] pt-10 md:pt-16">
      <label htmlFor="q" className="sr-only">{t("searchTitle")}</label>
      <div className="flex items-center gap-3 border-b border-ink pb-2">
        <SearchIcon width={26} height={26} />
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={filters.q}
          autoFocus={!filters.q}
          minLength={2}
          maxLength={100}
          enterKeyHint="search"
          placeholder={t("searchPlaceholder")}
          className="h-14 w-full bg-transparent font-serif text-3xl placeholder:text-muted/60 focus:outline-none md:text-4xl"
        />
      </div>
      {!filters.q && <p className="mt-4 text-sm text-muted">{t("searchHint")}</p>}
    </form>
  );

  if (!filters.q) {
    return (
      <>
        <SiteHeader />
        <main id="main" className="min-h-[50svh]">{form}</main>
      </>
    );
  }

  const result = await listProducts(filters, locale);
  return (
    <>
      <SiteHeader />
      {form}
      <CatalogView
        title={t("searchResults", { q: filters.q })}
        basePath="/search"
        filters={filters}
        result={result}
        crumbs={[{ name: t("home"), href: "/" }, { name: t("searchTitle") }]}
      />
    </>
  );
}
