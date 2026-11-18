import "server-only";
import { prisma } from "@/lib/prisma";
import { localized } from "@/services/catalog";
import type { ProductFormData } from "@/components/admin/ProductForm";

export async function loadFormOptions() {
  const [categories, collections, colors, sizes] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, orderBy: [{ gender: "asc" }, { sortOrder: "asc" }], include: { translations: { where: { locale: "uz" } } } }),
    prisma.collection.findMany({ orderBy: { sortOrder: "asc" }, include: { translations: { where: { locale: "uz" } } } }),
    prisma.color.findMany({ orderBy: { code: "asc" } }),
    prisma.size.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return {
    categories: categories.map((c) => ({ id: c.id, gender: c.gender, label: `${c.gender === "MEN" ? "Erkaklar" : c.gender === "WOMEN" ? "Ayollar" : "Uniseks"} · ${c.translations[0]?.name ?? c.slug}` })),
    collections: collections.map((c) => ({ id: c.id, label: c.translations[0]?.name ?? c.slug })),
    colors: colors.map((c) => ({ id: c.id, hex: c.hex, label: localized(c.names, "uz") || c.code })),
    sizes: sizes.map((s) => ({ id: s.id, label: s.code })),
  };
}

export const emptyProduct: ProductFormData = {
  sku: "",
  slug: "",
  brand: "FABIANO",
  gender: "MEN",
  categoryId: "",
  price: "",
  compareAtPrice: "",
  status: "DRAFT",
  isNew: true,
  isFeatured: false,
  collectionIds: [],
  translations: {
    uz: { name: "", description: "", material: "", care: "" },
    ru: { name: "", description: "", material: "", care: "" },
    en: { name: "", description: "", material: "", care: "" },
  },
  variants: [],
};

export async function loadProductForm(id: string): Promise<ProductFormData | null> {
  const p = await prisma.product.findUnique({
    where: { id },
    include: { translations: true, collections: true, variants: { where: { isActive: true }, include: { inventory: true } } },
  });
  if (!p) return null;
  const tr = (l: "uz" | "ru" | "en") => {
    const t = p.translations.find((x) => x.locale === l);
    return { name: t?.name ?? "", description: t?.description ?? "", material: t?.material ?? "", care: t?.care ?? "" };
  };
  return {
    id: p.id,
    sku: p.sku,
    slug: p.slug,
    brand: p.brand,
    gender: p.gender,
    categoryId: p.categoryId,
    price: p.price.toFixed(0),
    compareAtPrice: p.compareAtPrice?.toFixed(0) ?? "",
    status: p.status,
    isNew: p.isNew,
    isFeatured: p.isFeatured,
    collectionIds: p.collections.map((c) => c.collectionId),
    translations: { uz: tr("uz"), ru: tr("ru"), en: tr("en") },
    variants: p.variants.map((v) => ({ colorId: v.colorId, sizeId: v.sizeId, stock: v.inventory?.quantity ?? 0, reserved: v.inventory?.reserved ?? 0 })),
  };
}
