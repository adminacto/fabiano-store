import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { locales } from "@/i18n/routing";

export const revalidate = 3600;

/** Товары, категории, коллекции и статические разделы во всех языках с hreflang-альтернативами. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.APP_URL || process.env.RENDER_EXTERNAL_URL) ?? "http://localhost:3000";
  const entry = (path: string, lastModified?: Date, priority = 0.6): MetadataRoute.Sitemap[number] => ({
    url: `${base}/${locales[0]}${path}`,
    lastModified,
    priority,
    alternates: { languages: Object.fromEntries(locales.map((l) => [l, `${base}/${l}${path}`])) },
  });

  const [products, categories, collections] = await Promise.all([
    prisma.product.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true, gender: true, updatedAt: true } }),
    prisma.collection.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
  ]);

  return [
    entry("", undefined, 1),
    entry("/men", undefined, 0.9),
    entry("/women", undefined, 0.9),
    entry("/catalog", undefined, 0.8),
    entry("/collections", undefined, 0.7),
    ...categories.filter((c) => c.gender !== "UNISEX").map((c) => entry(`/${c.gender === "MEN" ? "men" : "women"}/${c.slug}`, c.updatedAt, 0.8)),
    ...collections.map((c) => entry(`/collections/${c.slug}`, c.updatedAt, 0.7)),
    ...products.map((p) => entry(`/product/${p.slug}`, p.updatedAt, 0.7)),
  ];
}
