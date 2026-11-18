"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/features/auth/session";
import { resolveCart } from "@/services/cart";
import { MAX_QTY_PER_LINE } from "@/services/pricing";
import { isLocale } from "@/i18n/routing";

/** Повторный заказ: добавляет в корзину те позиции заказа, которые ещё продаются и есть на складе. */
export async function reorderAction(form: FormData) {
  const locale = String(form.get("locale") ?? "uz");
  const loc = isLocale(locale) ? locale : "uz";
  const user = await getSessionUser();
  if (!user) redirect(`/${loc}/account`);
  const number = String(form.get("number") ?? "");
  const order = await prisma.order.findFirst({ where: { number, userId: user.id }, include: { items: true } });
  if (!order) redirect(`/${loc}/account`);

  const cart = (await resolveCart(true))!;
  for (const item of order.items) {
    if (!item.variantId) continue;
    const v = await prisma.productVariant.findFirst({
      where: { id: item.variantId, isActive: true, product: { status: "ACTIVE" } },
      include: { inventory: true },
    });
    const available = v?.inventory ? v.inventory.quantity - v.inventory.reserved : 0;
    if (!v || available <= 0) continue;
    const existing = await prisma.cartItem.findUnique({ where: { cartId_variantId: { cartId: cart.id, variantId: v.id } } });
    const qty = Math.min((existing?.quantity ?? 0) + item.quantity, available, MAX_QTY_PER_LINE);
    await prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId: v.id } },
      create: { cartId: cart.id, variantId: v.id, quantity: qty },
      update: { quantity: qty },
    });
  }
  redirect(`/${loc}/cart`);
}
