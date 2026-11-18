/** Логика выбора цвета/размера на странице товара. Чистые функции — используются на сервере и клиенте. */

export interface VariantOption {
  id: string;
  sku: string;
  colorCode: string;
  size: string;
  sizeOrder: number;
  available: number;
  price: string;
}

export interface ColorOption {
  code: string;
  name: string;
  hex: string;
}

export interface GalleryImage {
  url: string;
  width: number;
  height: number;
  alt: string;
  colorCode: string | null;
}

export function sizesFor(variants: VariantOption[]): string[] {
  const m = new Map<string, number>();
  for (const v of variants) m.set(v.size, v.sizeOrder);
  return [...m.entries()].sort((a, b) => a[1] - b[1]).map(([s]) => s);
}

export function findVariant(variants: VariantOption[], colorCode: string | null, size: string | null): VariantOption | null {
  if (!colorCode || !size) return null;
  return variants.find((v) => v.colorCode === colorCode && v.size === size) ?? null;
}

/** Состояние размера для выбранного цвета: нет такой комбинации / нет в наличии / доступен. */
export function sizeState(variants: VariantOption[], colorCode: string, size: string): "missing" | "soldout" | "available" {
  const v = findVariant(variants, colorCode, size);
  if (!v) return "missing";
  return v.available > 0 ? "available" : "soldout";
}

/** Начальный цвет: из URL, если такой есть; иначе первый цвет с наличием; иначе первый. */
export function initialColor(colors: ColorOption[], variants: VariantOption[], requested?: string | null): string | null {
  if (requested && colors.some((c) => c.code === requested)) return requested;
  const inStock = colors.find((c) => variants.some((v) => v.colorCode === c.code && v.available > 0));
  return inStock?.code ?? colors[0]?.code ?? null;
}

/** Единственный размер (ONE, аксессуары) выбирается автоматически. */
export function initialSize(variants: VariantOption[], colorCode: string | null): string | null {
  if (!colorCode) return null;
  const forColor = variants.filter((v) => v.colorCode === colorCode);
  return forColor.length === 1 ? forColor[0]!.size : null;
}

/** Фото выбранного цвета; общие фото (без цвета) — следом. Если для цвета фото нет — все общие или все вообще. */
export function imagesForColor(images: GalleryImage[], colorCode: string | null): GalleryImage[] {
  const own = images.filter((i) => colorCode && i.colorCode === colorCode);
  const shared = images.filter((i) => i.colorCode === null);
  if (own.length) return [...own, ...shared];
  return shared.length ? shared : images;
}

export function totalAvailable(variants: VariantOption[]): number {
  return variants.reduce((s, v) => s + Math.max(0, v.available), 0);
}
