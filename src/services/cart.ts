import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/media";
import { fromMinor, toMinor } from "@/lib/money";
import { signValue, verifySignedValue } from "@/lib/signed-value";
import { getSessionUser } from "@/features/auth/session";
import { calculateTotals, MAX_QTY_PER_LINE, type CouponRule, type Totals } from "./pricing";
import { localized } from "./catalog";
import type { AppLocale } from "@/i18n/routing";

export const CART_COOKIE = "fb_cart";
const GUEST_CART_DAYS = 30;

function secret(): string {
  const s = process.env.CART_COOKIE_SECRET;
  if (!s) throw new Error("CART_COOKIE_SECRET is not set");
  return s;
}

export class CartError extends Error {
  constructor(
    public code: "VARIANT_NOT_FOUND" | "OUT_OF_STOCK" | "INSUFFICIENT_STOCK" | "ITEM_NOT_FOUND" | "INVALID_QUANTITY" | "COUPON_NOT_FOUND",
    public details: Record<string, unknown> = {},
  ) {
    super(code);
  }
}

/** Корзина пользователя или гостя. create=false — только чтение (не создаём пустые корзины на каждый GET). */
export async function resolveCart(create: boolean): Promise<{ id: string } | null> {
  const user = await getSessionUser();
  if (user) {
    const existing = await prisma.cart.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (existing || !create) return existing;
    return prisma.cart.create({ data: { userId: user.id }, select: { id: true } });
  }

  const jar = await cookies();
  const guestId = verifySignedValue(jar.get(CART_COOKIE)?.value, secret());
  if (guestId) {
    const cart = await prisma.cart.findFirst({ where: { id: guestId, userId: null }, select: { id: true } });
    if (cart) return cart;
  }
  if (!create) return null;

  const cart = await prisma.cart.create({
    data: { expiresAt: new Date(Date.now() + GUEST_CART_DAYS * 86_400_000) },
    select: { id: true },
  });
  jar.set(CART_COOKIE, signValue(cart.id, secret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GUEST_CART_DAYS * 86_400,
  });
  return cart;
}

async function availableFor(variantId: string): Promise<number> {
  const inv = await prisma.inventory.findUnique({ where: { variantId }, select: { quantity: true, reserved: true } });
  return inv ? Math.max(0, inv.quantity - inv.reserved) : 0;
}

async function assertSellableVariant(variantId: string) {
  const v = await prisma.productVariant.findFirst({
    where: { id: variantId, isActive: true, product: { status: "ACTIVE" } },
    select: { id: true },
  });
  if (!v) throw new CartError("VARIANT_NOT_FOUND");
}

export async function addToCart(variantId: string, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY_PER_LINE) throw new CartError("INVALID_QUANTITY");
  await assertSellableVariant(variantId);
  const cart = (await resolveCart(true))!;
  const existing = await prisma.cartItem.findUnique({ where: { cartId_variantId: { cartId: cart.id, variantId } } });
  const wanted = (existing?.quantity ?? 0) + quantity;
  const available = await availableFor(variantId);
  if (available === 0) throw new CartError("OUT_OF_STOCK");
  if (wanted > available || wanted > MAX_QTY_PER_LINE) {
    throw new CartError("INSUFFICIENT_STOCK", { available: Math.min(available, MAX_QTY_PER_LINE), inCart: existing?.quantity ?? 0 });
  }
  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    create: { cartId: cart.id, variantId, quantity: wanted },
    update: { quantity: wanted },
  });
}

/** Изменение количества и/или варианта (смена размера/цвета прямо в корзине). */
export async function updateCartItem(itemId: string, patch: { quantity?: number; variantId?: string }) {
  const cart = await resolveCart(false);
  const item = cart && (await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } }));
  if (!cart || !item) throw new CartError("ITEM_NOT_FOUND");

  const quantity = patch.quantity ?? item.quantity;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY_PER_LINE) throw new CartError("INVALID_QUANTITY");

  let variantId = item.variantId;
  if (patch.variantId && patch.variantId !== item.variantId) {
    // Новый вариант должен принадлежать тому же товару
    const [from, to] = await Promise.all([
      prisma.productVariant.findUnique({ where: { id: item.variantId }, select: { productId: true } }),
      prisma.productVariant.findFirst({ where: { id: patch.variantId, isActive: true, product: { status: "ACTIVE" } }, select: { productId: true } }),
    ]);
    if (!to || to.productId !== from?.productId) throw new CartError("VARIANT_NOT_FOUND");
    variantId = patch.variantId;
  }

  const available = await availableFor(variantId);
  const sameVariantLine = variantId !== item.variantId
    ? await prisma.cartItem.findUnique({ where: { cartId_variantId: { cartId: cart.id, variantId } } })
    : null;
  const total = quantity + (sameVariantLine?.quantity ?? 0);
  if (available === 0) throw new CartError("OUT_OF_STOCK");
  if (total > available) throw new CartError("INSUFFICIENT_STOCK", { available });

  await prisma.$transaction(async (tx) => {
    if (sameVariantLine) {
      // Уже есть такая строка — объединяем
      await tx.cartItem.update({ where: { id: sameVariantLine.id }, data: { quantity: Math.min(total, MAX_QTY_PER_LINE) } });
      await tx.cartItem.delete({ where: { id: item.id } });
    } else {
      await tx.cartItem.update({ where: { id: item.id }, data: { quantity, variantId } });
    }
  });
}

export async function removeCartItem(itemId: string) {
  const cart = await resolveCart(false);
  if (!cart) throw new CartError("ITEM_NOT_FOUND");
  const { count } = await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
  if (count === 0) throw new CartError("ITEM_NOT_FOUND");
}

export async function setCartCoupon(code: string | null) {
  const cart = (await resolveCart(code !== null))!;
  if (!cart) return;
  if (code !== null) {
    const exists = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() }, select: { id: true } });
    if (!exists) throw new CartError("COUPON_NOT_FOUND");
  }
  await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: code?.trim().toUpperCase() ?? null } });
}

// ── Представление корзины ─────────────────────────────

export interface CartLineView {
  id: string;
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  sku: string;
  size: string;
  color: { code: string; name: string; hex: string };
  unitPrice: string;
  compareAtPrice: string | null;
  quantity: number;
  available: number;
  lineTotal: string;
  image: string | null;
  /** Все варианты товара — для смены размера/цвета в корзине */
  options: { variantId: string; size: string; colorCode: string; colorName: string; available: number }[];
}

export interface CartView {
  id: string | null;
  lines: CartLineView[];
  totals: Totals;
  couponCode: string | null;
  shippingEstimated: boolean;
}

export async function loadCouponRule(code: string, userId: string | null): Promise<CouponRule | null> {
  const c = await prisma.coupon.findUnique({ where: { code } });
  if (!c) return null;
  const customerUsageCount = userId ? await prisma.couponUsage.count({ where: { couponId: c.id, userId } }) : 0;
  return {
    code: c.code,
    type: c.type,
    value: c.value.toString(),
    minOrderAmount: c.minOrderAmount?.toString() ?? null,
    maxDiscount: c.maxDiscount?.toString() ?? null,
    startsAt: c.startsAt,
    expiresAt: c.expiresAt,
    isActive: c.isActive,
    usageLimit: c.usageLimit,
    usedCount: c.usedCount,
    perUserLimit: c.perUserLimit,
    customerUsageCount,
  };
}

export async function getCartView(locale: AppLocale): Promise<CartView> {
  const cart = await resolveCart(false);
  const empty = calculateTotals({ lines: [] });
  if (!cart) return { id: null, lines: [], totals: empty, couponCode: null, shippingEstimated: false };

  const data = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          variant: {
            include: {
              size: true,
              color: true,
              inventory: true,
              product: {
                include: {
                  translations: { where: { locale }, select: { name: true } },
                  images: { orderBy: { sortOrder: "asc" }, select: { storageKey: true, colorId: true } },
                  variants: { where: { isActive: true }, include: { size: true, color: true, inventory: true }, orderBy: { size: { sortOrder: "asc" } } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!data) return { id: null, lines: [], totals: empty, couponCode: null, shippingEstimated: false };

  const avail = (inv: { quantity: number; reserved: number } | null) => (inv ? Math.max(0, inv.quantity - inv.reserved) : 0);

  // Снятые с продажи товары не показываем (и не считаем)
  const items = data.items.filter((i) => i.variant.isActive && i.variant.product.status === "ACTIVE");

  const lines: CartLineView[] = items.map((i) => {
    const v = i.variant;
    const p = v.product;
    const unit = (v.priceOverride ?? p.price).toString();
    const img = p.images.find((im) => im.colorId === v.colorId) ?? p.images[0];
    return {
      id: i.id,
      variantId: v.id,
      productId: p.id,
      slug: p.slug,
      name: p.translations[0]?.name ?? p.sku,
      sku: v.sku,
      size: v.size.code,
      color: { code: v.color.code, name: localized(v.color.names, locale), hex: v.color.hex },
      unitPrice: unit,
      compareAtPrice: p.compareAtPrice?.toString() ?? null,
      quantity: i.quantity,
      available: avail(v.inventory),
      lineTotal: fromMinor(toMinor(unit) * BigInt(i.quantity)),
      image: mediaUrl(img?.storageKey),
      options: p.variants.map((o) => ({
        variantId: o.id,
        size: o.size.code,
        colorCode: o.color.code,
        colorName: localized(o.color.names, locale),
        available: avail(o.inventory),
      })),
    };
  });

  const user = await getSessionUser();
  const coupon = data.couponCode ? await loadCouponRule(data.couponCode, user?.id ?? null) : null;
  const courier = await prisma.deliveryMethod.findFirst({ where: { isEnabled: true, type: "COURIER" }, orderBy: { sortOrder: "asc" } });

  const totals = calculateTotals({
    lines: lines.map((l) => ({ variantId: l.variantId, unitPrice: l.unitPrice, quantity: l.quantity, available: l.available })),
    coupon,
    delivery: courier ? { price: courier.price.toString(), freeFrom: courier.freeFrom?.toString() ?? null } : null,
  });

  return { id: data.id, lines, totals, couponCode: data.couponCode, shippingEstimated: Boolean(courier) };
}

/** Слияние гостевой корзины при входе. Вызывается из login/register action (PHASE 3). */
export async function mergeGuestCartIntoUser(userId: string) {
  const jar = await cookies();
  const guestId = verifySignedValue(jar.get(CART_COOKIE)?.value, secret());
  jar.delete(CART_COOKIE);
  if (!guestId) return { adjusted: [] };

  const { mergeCarts } = await import("./cart-merge");
  return prisma.$transaction(async (tx) => {
    const guest = await tx.cart.findFirst({ where: { id: guestId, userId: null }, include: { items: true } });
    if (!guest || guest.items.length === 0) {
      if (guest) await tx.cart.delete({ where: { id: guest.id } });
      return { adjusted: [] };
    }
    const userCart = await tx.cart.upsert({ where: { userId }, create: { userId }, update: {}, include: { items: true } });
    const ids = [...new Set([...guest.items, ...userCart.items].map((i) => i.variantId))];
    const inv = await tx.inventory.findMany({ where: { variantId: { in: ids } } });
    const stock = new Map(inv.map((x) => [x.variantId, Math.max(0, x.quantity - x.reserved)]));
    const merged = mergeCarts(userCart.items, guest.items, (id) => stock.get(id) ?? 0);

    await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
    await tx.cartItem.createMany({ data: merged.items.map((i) => ({ cartId: userCart.id, ...i })) });
    if (!userCart.couponCode && guest.couponCode) {
      await tx.cart.update({ where: { id: userCart.id }, data: { couponCode: guest.couponCode } });
    }
    await tx.cart.delete({ where: { id: guest.id } });
    return { adjusted: merged.adjusted };
  });
}
