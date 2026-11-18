import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AppLocale } from "@/i18n/routing";
import { buildOrderBy, buildProductWhere, pagination, type CatalogFilters } from "@/features/catalog/filters";
import { cardInclude, localized, toCard, type ProductCardData } from "./catalog";

export interface Facets {
  sizes: string[];
  colors: { code: string; hex: string; name: string }[];
  brands: string[];
  price: { min: number; max: number } | null;
}

export interface CatalogResult {
  items: ProductCardData[];
  total: number;
  page: ReturnType<typeof pagination>;
  facets: Facets;
}

/** Базовая область (пол/категория/коллекция/поиск) — для фасетов, без пользовательских фильтров. */
function scopeOf(f: CatalogFilters): CatalogFilters {
  return { ...f, sizes: [], colors: [], brands: [], minPrice: undefined, maxPrice: undefined, inStock: false, sale: false, isNew: false };
}

export async function listProducts(f: CatalogFilters, locale: AppLocale): Promise<CatalogResult> {
  const where = buildProductWhere(f, locale) as Prisma.ProductWhereInput;
  const total = await prisma.product.count({ where });
  const page = pagination(total, f.page);

  const [rows, facets] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: buildOrderBy(f.sort) as Prisma.ProductOrderByWithRelationInput[],
      skip: page.skip,
      take: page.take,
      include: cardInclude(locale),
    }),
    getFacets(scopeOf(f), locale),
  ]);

  return { items: rows.map((r) => toCard(r, locale)), total, page, facets };
}

async function getFacets(scope: CatalogFilters, locale: AppLocale): Promise<Facets> {
  const productWhere = buildProductWhere(scope, locale) as Prisma.ProductWhereInput;
  const [variants, brands, price] = await Promise.all([
    prisma.productVariant.findMany({
      where: { isActive: true, product: productWhere },
      distinct: ["sizeId", "colorId"],
      select: { size: { select: { code: true, sortOrder: true } }, color: { select: { code: true, hex: true, names: true } } },
    }),
    prisma.product.findMany({ where: productWhere, distinct: ["brand"], select: { brand: true }, orderBy: { brand: "asc" } }),
    prisma.product.aggregate({ where: productWhere, _min: { price: true }, _max: { price: true } }),
  ]);

  const sizes = new Map<string, number>();
  const colors = new Map<string, Facets["colors"][number]>();
  for (const v of variants) {
    sizes.set(v.size.code, v.size.sortOrder);
    colors.set(v.color.code, { code: v.color.code, hex: v.color.hex, name: localized(v.color.names, locale) });
  }

  return {
    sizes: [...sizes.entries()].sort((a, b) => a[1] - b[1]).map(([code]) => code),
    colors: [...colors.values()].sort((a, b) => a.name.localeCompare(b.name, locale)),
    brands: brands.map((b) => b.brand),
    price:
      price._min.price && price._max.price
        ? { min: Math.floor(Number(price._min.price)), max: Math.ceil(Number(price._max.price)) }
        : null,
  };
}

export interface CategoryLink {
  slug: string;
  name: string;
}

export async function getGenderCategories(gender: "MEN" | "WOMEN", locale: AppLocale): Promise<CategoryLink[]> {
  const rows = await prisma.category.findMany({
    where: { gender, isActive: true, parentId: null },
    orderBy: { sortOrder: "asc" },
    include: { translations: { where: { locale }, select: { name: true } } },
  });
  return rows.map((c) => ({ slug: c.slug, name: c.translations[0]?.name ?? c.slug }));
}

export async function getCategoryMeta(gender: "MEN" | "WOMEN", slug: string, locale: AppLocale) {
  const c = await prisma.category.findUnique({
    where: { gender_slug: { gender, slug } },
    include: { translations: { where: { locale } } },
  });
  if (!c || !c.isActive) return null;
  const t = c.translations[0];
  return { name: t?.name ?? slug, description: t?.description ?? null, metaTitle: t?.metaTitle ?? null, metaDescription: t?.metaDescription ?? null };
}

export async function getCollectionMeta(slug: string, locale: AppLocale) {
  const c = await prisma.collection.findUnique({ where: { slug }, include: { translations: { where: { locale } } } });
  if (!c || !c.isActive) return null;
  return { name: c.translations[0]?.name ?? slug, description: c.translations[0]?.description ?? null };
}

export async function getAllCollections(locale: AppLocale) {
  const rows = await prisma.collection.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { translations: { where: { locale } } },
  });
  return rows.map((c) => ({ slug: c.slug, name: c.translations[0]?.name ?? c.slug, imageKey: c.imageUrl }));
}
