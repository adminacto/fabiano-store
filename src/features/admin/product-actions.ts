"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { deleteStoredImage, storeImage, UploadError } from "@/lib/media-store";
import { requireAdmin } from "./guard";
import type { FormState } from "./auth-actions";

const money = z.string().trim().regex(/^\d{1,12}(\.\d{1,2})?$/, "price");
const LOCALES = ["uz", "ru", "en"] as const;

const schema = z.object({
  id: z.string().optional(),
  sku: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{2,30}$/),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80).optional().or(z.literal("")),
  brand: z.string().trim().min(1).max(40),
  gender: z.enum(["MEN", "WOMEN", "UNISEX"]),
  categoryId: z.string().min(1),
  price: money,
  compareAtPrice: money.optional().or(z.literal("")),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  isNew: z.boolean(),
  isFeatured: z.boolean(),
});

const variantsSchema = z.array(z.object({ colorId: z.string().min(1), sizeId: z.string().min(1), stock: z.number().int().min(0).max(100000) })).max(400);

function slugify(s: string) {
  const map: Record<string, string> = { "ʻ": "", "'": "", "’": "", ш: "sh", ч: "ch", щ: "sch", ж: "zh", ю: "yu", я: "ya", ё: "yo", х: "h", ц: "ts", ы: "y", э: "e", й: "y" };
  const lat = "абвгдезиклмнопрстуф".split("");
  const latTo = "abvgdeziklmnoprstuf".split("");
  return s
    .toLowerCase()
    .split("")
    .map((c) => map[c] ?? (lat.indexOf(c) >= 0 ? latTo[lat.indexOf(c)] : c))
    .join("")
    .replace(/[ъь]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

export async function saveProductAction(_prev: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin("products:write");
  const parsed = schema.safeParse({
    id: form.get("id") || undefined,
    sku: form.get("sku"),
    slug: form.get("slug") ?? "",
    brand: form.get("brand") || "FABIANO",
    gender: form.get("gender"),
    categoryId: form.get("categoryId"),
    price: form.get("price"),
    compareAtPrice: form.get("compareAtPrice") ?? "",
    status: form.get("status"),
    isNew: form.get("isNew") === "on",
    isFeatured: form.get("isFeatured") === "on",
  });
  if (!parsed.success) {
    const f = String(parsed.error.issues[0]?.path[0] ?? "");
    const msg: Record<string, string> = {
      sku: "Артикул: 2–30 символов, латиница, цифры и дефис.",
      slug: "Адрес (slug): латиница, цифры и дефисы.",
      price: "Укажите цену числом, например 289000.",
      compareAtPrice: "Старая цена — числом, например 349000.",
      categoryId: "Выберите категорию.",
    };
    return { error: msg[f] ?? "Проверьте заполнение полей." };
  }
  const d = parsed.data;
  if (d.compareAtPrice && Number(d.compareAtPrice) <= Number(d.price)) return { error: "Старая цена должна быть больше текущей." };
  if (Number(d.price) <= 0) return { error: "Цена должна быть больше нуля." };

  const tr = LOCALES.map((l) => ({
    locale: l,
    name: String(form.get(`name_${l}`) ?? "").trim(),
    description: String(form.get(`description_${l}`) ?? "").trim(),
    material: String(form.get(`material_${l}`) ?? "").trim() || null,
    care: String(form.get(`care_${l}`) ?? "").trim() || null,
  }));
  for (const l of ["uz", "ru"] as const) {
    const t = tr.find((x) => x.locale === l)!;
    if (!t.name || !t.description) return { error: `Заполните название и описание (${l.toUpperCase()}).` };
  }
  const translations = tr.filter((t) => t.name && t.description);

  let variants: z.infer<typeof variantsSchema>;
  try {
    variants = variantsSchema.parse(JSON.parse(String(form.get("variants") ?? "[]")));
  } catch {
    return { error: "Некорректные данные вариантов." };
  }
  if (d.status === "ACTIVE" && variants.length === 0) return { error: "Чтобы опубликовать товар, добавьте хотя бы один цвет и размер." };

  const collectionIds = form.getAll("collectionIds").map(String).filter(Boolean);
  const nameForSlug = tr.find((t) => t.locale === "en")?.name || tr.find((t) => t.locale === "uz")!.name;
  const slug = d.slug || `${slugify(nameForSlug) || "product"}-${d.sku.toLowerCase()}`;

  const clash = await prisma.product.findFirst({
    where: { OR: [{ slug }, { sku: d.sku }], ...(d.id ? { NOT: { id: d.id } } : {}) },
    select: { slug: true, sku: true },
  });
  if (clash) return { error: clash.sku === d.sku ? "Товар с таким артикулом уже есть." : "Такой адрес (slug) уже занят." };

  const [colors, sizes] = await Promise.all([prisma.color.findMany(), prisma.size.findMany()]);
  const colorById = new Map(colors.map((c) => [c.id, c]));
  const sizeById = new Map(sizes.map((s) => [s.id, s]));

  let productId: string;
  try {
    productId = await prisma.$transaction(async (tx) => {
      const existing = d.id ? await tx.product.findUnique({ where: { id: d.id }, select: { publishedAt: true } }) : null;
      if (d.id && !existing) throw new Error("NOT_FOUND");
      const data = {
        sku: d.sku,
        slug,
        brand: d.brand,
        gender: d.gender,
        categoryId: d.categoryId,
        price: d.price,
        compareAtPrice: d.compareAtPrice || null,
        status: d.status,
        isNew: d.isNew,
        isFeatured: d.isFeatured,
        publishedAt: d.status === "ACTIVE" ? existing?.publishedAt ?? new Date() : existing?.publishedAt ?? null,
      };
      const p = d.id ? await tx.product.update({ where: { id: d.id }, data }) : await tx.product.create({ data });

      await tx.productTranslation.deleteMany({ where: { productId: p.id, locale: { notIn: translations.map((t) => t.locale) } } });
      for (const t of translations) {
        await tx.productTranslation.upsert({
          where: { productId_locale: { productId: p.id, locale: t.locale } },
          create: { productId: p.id, ...t },
          update: { name: t.name, description: t.description, material: t.material, care: t.care },
        });
      }

      await tx.productCollection.deleteMany({ where: { productId: p.id } });
      if (collectionIds.length) await tx.productCollection.createMany({ data: collectionIds.map((collectionId) => ({ productId: p.id, collectionId })) });

      const keep: string[] = [];
      for (const v of variants) {
        const color = colorById.get(v.colorId);
        const size = sizeById.get(v.sizeId);
        if (!color || !size) continue;
        const sku = `${d.sku}-${color.code}-${size.code}`.toUpperCase().replace(/[^A-Z0-9-]/g, "");
        const variant = await tx.productVariant.upsert({
          where: { productId_colorId_sizeId: { productId: p.id, colorId: color.id, sizeId: size.id } },
          create: { productId: p.id, colorId: color.id, sizeId: size.id, sku },
          update: { isActive: true, sku },
        });
        keep.push(variant.id);
        const inv = await tx.inventory.findUnique({ where: { variantId: variant.id } });
        if (inv && v.stock < inv.reserved) throw new Error(`RESERVED:${color.code}/${size.code}:${inv.reserved}`);
        await tx.inventory.upsert({ where: { variantId: variant.id }, create: { variantId: variant.id, quantity: v.stock }, update: { quantity: v.stock } });
      }
      // Снятые варианты не удаляем (история заказов), а выключаем
      await tx.productVariant.updateMany({ where: { productId: p.id, id: { notIn: keep } }, data: { isActive: false } });

      await tx.auditLog.create({ data: { actorId: admin.id, action: d.id ? "product.update" : "product.create", entity: "Product", entityId: p.id } });
      return p.id;
    });
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    if (m.startsWith("RESERVED:")) {
      const [, combo, n] = m.split(":");
      return { error: `Нельзя поставить остаток ${combo} меньше ${n}: столько уже зарезервировано в заказах.` };
    }
    console.error("[admin] saveProduct", e);
    return { error: "Не удалось сохранить товар." };
  }

  revalidatePath("/", "layout");
  redirect(`/admin/products/${productId}?saved=1`);
}

export async function deleteProductAction(form: FormData) {
  const admin = await requireAdmin("products:write");
  const id = String(form.get("id") ?? "");
  const images = await prisma.productImage.findMany({ where: { productId: id }, select: { storageKey: true } });
  const inOrders = await prisma.orderItem.count({ where: { productId: id } });
  if (inOrders > 0) {
    // Товар из истории заказов не удаляем — архивируем
    await prisma.product.update({ where: { id }, data: { status: "ARCHIVED" } });
  } else {
    await prisma.product.delete({ where: { id } });
    for (const i of images) await deleteStoredImage(i.storageKey);
  }
  await prisma.auditLog.create({ data: { actorId: admin.id, action: inOrders ? "product.archive" : "product.delete", entity: "Product", entityId: id } });
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function uploadImagesAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin("products:write");
  const productId = String(form.get("productId") ?? "");
  const colorId = String(form.get("colorId") ?? "") || null;
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { error: "Выберите файлы." };
  if (files.length > 12) return { error: "Не больше 12 файлов за раз." };
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, _count: { select: { images: true } } } });
  if (!product) return { error: "Товар не найден." };

  let order = product._count.images;
  const failed: string[] = [];
  for (const f of files) {
    try {
      const stored = await storeImage(f);
      await prisma.productImage.create({ data: { productId, colorId, storageKey: stored.storageKey, width: stored.width, height: stored.height, sortOrder: order++ } });
    } catch (e) {
      const code = e instanceof UploadError ? e.code : "ERROR";
      failed.push(`${f.name} (${{ TOO_LARGE: "больше 12 МБ", NOT_IMAGE: "не изображение", UNSUPPORTED: "формат не поддерживается", EMPTY: "пустой файл" }[code as UploadError["code"]] ?? "ошибка"})`);
    }
  }
  revalidatePath("/", "layout");
  return failed.length ? { error: `Не загружены: ${failed.join(", ")}` } : { ok: `Загружено фото: ${files.length}` };
}

export async function updateImageAction(form: FormData) {
  await requireAdmin("products:write");
  const id = String(form.get("id") ?? "");
  const productId = String(form.get("productId") ?? "");
  const colorId = String(form.get("colorId") ?? "") || null;
  const sortOrder = Number(form.get("sortOrder") ?? 0);
  await prisma.productImage.updateMany({ where: { id, productId }, data: { colorId, sortOrder: Number.isFinite(sortOrder) ? Math.max(0, Math.min(999, Math.round(sortOrder))) : 0 } });
  revalidatePath("/", "layout");
  redirect(`/admin/products/${productId}#images`);
}

export async function deleteImageAction(form: FormData) {
  await requireAdmin("products:write");
  const id = String(form.get("id") ?? "");
  const productId = String(form.get("productId") ?? "");
  const img = await prisma.productImage.findFirst({ where: { id, productId } });
  if (img) {
    await prisma.productImage.delete({ where: { id } });
    await deleteStoredImage(img.storageKey);
  }
  revalidatePath("/", "layout");
  redirect(`/admin/products/${productId}#images`);
}
