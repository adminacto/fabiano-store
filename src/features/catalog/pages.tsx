/**
 * Общая логика страниц каталога. Маршруты (men, women, catalog, search, collections) — тонкие обёртки.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CatalogView } from "@/components/catalog/CatalogView";
import { activeFilterCount, parseCatalogFilters, type CatalogFilters, type GenderFilter } from "./filters";
import { getCategoryMeta, getCollectionMeta, getGenderCategories, listProducts } from "@/services/catalog-list";
import type { AppLocale } from "@/i18n/routing";

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const GENDER_PATH: Record<GenderFilter, string> = { MEN: "/men", WOMEN: "/women" };
const GENDER_KEY: Record<GenderFilter, "men" | "women"> = { MEN: "men", WOMEN: "women" };

/** Отфильтрованные варианты не индексируются; каноникал — чистый путь (+ номер страницы). */
function seo(locale: string, path: string, f: CatalogFilters, title: string, description?: string | null): Metadata {
  const filtered = activeFilterCount(f) > 0 || Boolean(f.q) || f.sort !== "featured";
  const canonical = `/${locale}${path}${f.page > 1 && !filtered ? `?page=${f.page}` : ""}`;
  return {
    title,
    description: description ?? undefined,
    alternates: { canonical },
    robots: filtered ? { index: false, follow: true } : undefined,
    openGraph: { title, description: description ?? undefined, url: canonical },
  };
}

// ── Men / Women ─────────────────────────────────────────

export async function genderMetadata(gender: GenderFilter, locale: AppLocale, category: string | undefined, sp: Awaited<SearchParams>): Promise<Metadata> {
  const tn = await getTranslations({ locale, namespace: "nav" });
  const f = parseCatalogFilters(sp, { gender, category });
  const base = GENDER_PATH[gender];
  if (!category) return seo(locale, base, f, tn(GENDER_KEY[gender]));
  const meta = await getCategoryMeta(gender, category, locale);
  if (!meta) return {};
  return seo(locale, `${base}/${category}`, f, meta.metaTitle ?? `${meta.name} — ${tn(GENDER_KEY[gender])}`, meta.metaDescription ?? meta.description);
}

export async function GenderCatalogPage({ gender, locale, category, searchParams }: { gender: GenderFilter; locale: AppLocale; category?: string; searchParams: Awaited<SearchParams> }) {
  setRequestLocale(locale);
  const [t, tn] = await Promise.all([getTranslations("catalog"), getTranslations("nav")]);
  const base = GENDER_PATH[gender];
  const genderName = tn(GENDER_KEY[gender]);

  const meta = category ? await getCategoryMeta(gender, category, locale) : null;
  if (category && !meta) notFound();

  const filters = parseCatalogFilters(searchParams, { gender, category });
  const [result, categories] = await Promise.all([listProducts(filters, locale), getGenderCategories(gender, locale)]);

  return (
    <>
      <SiteHeader />
      <CatalogView
        title={meta?.name ?? genderName}
        description={meta?.description}
        basePath={category ? `${base}/${category}` : base}
        filters={filters}
        result={result}
        categories={categories}
        activeCategory={category}
        categoryBase={base}
        crumbs={[
          { name: t("home"), href: "/" },
          ...(meta ? [{ name: genderName, href: base }, { name: meta.name }] : [{ name: genderName }]),
        ]}
      />
    </>
  );
}

// ── Весь каталог (+ new/sale из меню) ───────────────────

export async function allMetadata(locale: AppLocale, sp: Awaited<SearchParams>): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "catalog" });
  return seo(locale, "/catalog", parseCatalogFilters(sp), t("all"));
}

export async function AllCatalogPage({ locale, searchParams }: { locale: AppLocale; searchParams: Awaited<SearchParams> }) {
  setRequestLocale(locale);
  const t = await getTranslations("catalog");
  const tn = await getTranslations("nav");
  const filters = parseCatalogFilters(searchParams);
  const result = await listProducts(filters, locale);
  const title = filters.isNew && activeFilterCount(filters) === 1 ? tn("newArrivals") : filters.sale && activeFilterCount(filters) === 1 ? tn("sale") : t("all");
  return (
    <>
      <SiteHeader />
      <CatalogView title={title} basePath="/catalog" filters={filters} result={result} crumbs={[{ name: t("home"), href: "/" }, { name: title }]} />
    </>
  );
}

// ── Коллекция ──────────────────────────────────────────

export async function collectionMetadata(locale: AppLocale, slug: string, sp: Awaited<SearchParams>): Promise<Metadata> {
  const meta = await getCollectionMeta(slug, locale);
  if (!meta) return {};
  return seo(locale, `/collections/${slug}`, parseCatalogFilters(sp, { collection: slug }), meta.name, meta.description);
}

export async function CollectionPage({ locale, slug, searchParams }: { locale: AppLocale; slug: string; searchParams: Awaited<SearchParams> }) {
  setRequestLocale(locale);
  const t = await getTranslations("catalog");
  const meta = await getCollectionMeta(slug, locale);
  if (!meta) notFound();
  const filters = parseCatalogFilters(searchParams, { collection: slug });
  const result = await listProducts(filters, locale);
  return (
    <>
      <SiteHeader />
      <CatalogView
        title={meta.name}
        description={meta.description}
        basePath={`/collections/${slug}`}
        filters={filters}
        result={result}
        crumbs={[{ name: t("home"), href: "/" }, { name: t("collections"), href: "/collections" }, { name: meta.name }]}
      />
    </>
  );
}
