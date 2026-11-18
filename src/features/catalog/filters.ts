/**
 * Фильтры каталога живут в URL (SSR, индексация, шаринг ссылок).
 * parse → нормализованный объект → buildProductWhere/buildOrderBy (чистые функции, покрыты тестами).
 */

export const SORTS = ["featured", "newest", "price_asc", "price_desc", "best"] as const;
export type Sort = (typeof SORTS)[number];
export type GenderFilter = "MEN" | "WOMEN";

export const PAGE_SIZE = 24;
const MAX_LIST = 20;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CODE_RE = /^[A-Za-z0-9-]{1,20}$/;

export interface CatalogFilters {
  gender?: GenderFilter;
  category?: string;
  collection?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes: string[];
  colors: string[];
  brands: string[];
  inStock: boolean;
  sale: boolean;
  isNew: boolean;
  sort: Sort;
  page: number;
}

type Params = Record<string, string | string[] | undefined> | URLSearchParams;

function getAll(p: Params, key: string): string[] {
  if (p instanceof URLSearchParams) return p.getAll(key);
  const v = p[key];
  return v === undefined ? [] : Array.isArray(v) ? v : [v];
}

function first(p: Params, key: string): string | undefined {
  return getAll(p, key)[0];
}

/** "a,b" и повторяющиеся ключи (?size=S&size=M) — оба формата. */
function list(p: Params, key: string, re: RegExp): string[] {
  const out = new Set<string>();
  for (const raw of getAll(p, key)) {
    for (const part of raw.split(",")) {
      const v = part.trim();
      if (v && re.test(v)) out.add(v);
    }
  }
  return [...out].slice(0, MAX_LIST).sort();
}

function money(v: string | undefined): number | undefined {
  if (!v || !/^\d{1,12}$/.test(v)) return undefined;
  return Number(v);
}

const flag = (v: string | undefined) => v === "1" || v === "true";

export function parseCatalogFilters(params: Params, fixed: { gender?: GenderFilter; category?: string; collection?: string } = {}): CatalogFilters {
  const category = fixed.category ?? first(params, "category");
  const collection = fixed.collection ?? first(params, "collection");
  const qRaw = first(params, "q")?.trim().replace(/\s+/g, " ").slice(0, 100);
  const sortRaw = first(params, "sort");
  const pageRaw = Number(first(params, "page"));

  let minPrice = money(first(params, "min"));
  let maxPrice = money(first(params, "max"));
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];

  return {
    gender: fixed.gender,
    category: category && SLUG_RE.test(category) ? category : undefined,
    collection: collection && SLUG_RE.test(collection) ? collection : undefined,
    q: qRaw && qRaw.length >= 2 ? qRaw : undefined,
    minPrice,
    maxPrice,
    sizes: list(params, "size", CODE_RE),
    colors: list(params, "color", /^[a-z0-9-]{1,30}$/),
    brands: list(params, "brand", /^[A-Za-z0-9 &.-]{1,40}$/),
    inStock: flag(first(params, "stock")),
    sale: flag(first(params, "sale")),
    isNew: flag(first(params, "new")),
    sort: (SORTS as readonly string[]).includes(sortRaw ?? "") ? (sortRaw as Sort) : "featured",
    page: Number.isInteger(pageRaw) && pageRaw >= 1 && pageRaw <= 1000 ? pageRaw : 1,
  };
}

/** Обратно в query string. Значения по умолчанию опускаются → канонические короткие URL. */
export function serializeCatalogFilters(f: CatalogFilters, override: Partial<CatalogFilters> = {}, omitFixed = true): string {
  const v = { ...f, ...override };
  const sp = new URLSearchParams();
  if (!omitFixed && v.category) sp.set("category", v.category);
  if (!omitFixed && v.collection) sp.set("collection", v.collection);
  if (v.q) sp.set("q", v.q);
  if (v.minPrice !== undefined) sp.set("min", String(v.minPrice));
  if (v.maxPrice !== undefined) sp.set("max", String(v.maxPrice));
  if (v.sizes.length) sp.set("size", v.sizes.join(","));
  if (v.colors.length) sp.set("color", v.colors.join(","));
  if (v.brands.length) sp.set("brand", v.brands.join(","));
  if (v.inStock) sp.set("stock", "1");
  if (v.sale) sp.set("sale", "1");
  if (v.isNew) sp.set("new", "1");
  if (v.sort !== "featured") sp.set("sort", v.sort);
  if (v.page > 1) sp.set("page", String(v.page));
  const s = sp.toString().replace(/%2C/g, ","); // запятая в query допустима и читается лучше
  return s ? `?${s}` : "";
}

export function activeFilterCount(f: CatalogFilters): number {
  return (
    f.sizes.length + f.colors.length + f.brands.length +
    (f.minPrice !== undefined || f.maxPrice !== undefined ? 1 : 0) +
    (f.inStock ? 1 : 0) + (f.sale ? 1 : 0) + (f.isNew ? 1 : 0)
  );
}

/**
 * Prisma where. Возвращает plain object (без импорта Prisma), чтобы тестироваться без клиента.
 * Размер и цвет проверяются в ОДНОМ варианте: «M в чёрном», а не «есть M» и «есть чёрный» по отдельности.
 */
export function buildProductWhere(f: CatalogFilters, locale: string) {
  const and: Record<string, unknown>[] = [{ status: "ACTIVE" }];

  if (f.gender) and.push({ gender: { in: [f.gender, "UNISEX"] } });
  if (f.category) and.push({ category: { slug: f.category, isActive: true } });
  if (f.collection) and.push({ collections: { some: { collection: { slug: f.collection, isActive: true } } } });
  if (f.minPrice !== undefined) and.push({ price: { gte: f.minPrice } });
  if (f.maxPrice !== undefined) and.push({ price: { lte: f.maxPrice } });
  if (f.brands.length) and.push({ brand: { in: f.brands } });
  if (f.sale) and.push({ compareAtPrice: { not: null } });
  if (f.isNew) and.push({ isNew: true });

  if (f.sizes.length || f.colors.length || f.inStock) {
    const variant: Record<string, unknown> = { isActive: true };
    if (f.sizes.length) variant.size = { code: { in: f.sizes } };
    if (f.colors.length) variant.color = { code: { in: f.colors } };
    if (f.inStock) variant.inventory = { quantity: { gt: 0 } };
    and.push({ variants: { some: variant } });
  }

  if (f.q) {
    const contains = { contains: f.q, mode: "insensitive" };
    and.push({
      OR: [
        { translations: { some: { locale, OR: [{ name: contains }, { description: contains }, { material: contains }] } } },
        { category: { translations: { some: { locale, name: contains } } } },
        { sku: { equals: f.q.toUpperCase() } },
      ],
    });
  }

  return { AND: and };
}

export function buildOrderBy(sort: Sort) {
  const tiebreak = { id: "asc" as const }; // стабильная пагинация
  switch (sort) {
    case "newest":
      return [{ publishedAt: "desc" as const }, tiebreak];
    case "price_asc":
      return [{ price: "asc" as const }, tiebreak];
    case "price_desc":
      return [{ price: "desc" as const }, tiebreak];
    case "best":
      return [{ salesCount: "desc" as const }, { publishedAt: "desc" as const }, tiebreak];
    default:
      return [{ isFeatured: "desc" as const }, { publishedAt: "desc" as const }, tiebreak];
  }
}

export function pagination(total: number, page: number, pageSize = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pages);
  return { pages, current, skip: (current - 1) * pageSize, take: pageSize, hasPrev: current > 1, hasNext: current < pages };
}
