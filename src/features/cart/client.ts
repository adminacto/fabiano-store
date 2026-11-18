"use client";

import type { CartView } from "@/services/cart";

export const CART_EVENT = "fabiano:cart";

export type CartApiError = { error: string; available?: number };
export type CartApiResult = { ok: true; cart: CartView } | { ok: false; error: CartApiError };

async function call(method: string, path: string, locale: string, body?: unknown): Promise<CartApiResult> {
  try {
    const res = await fetch(`/api/v1/cart${path}?locale=${locale}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data as CartApiError };
    const cart = (data as { cart: CartView }).cart;
    // Header и другие виджеты обновляют счётчик
    window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { count: cart.totals.itemCount } }));
    return { ok: true, cart };
  } catch {
    return { ok: false, error: { error: "GENERIC" } };
  }
}

export const cartApi = {
  get: (locale: string) => call("GET", "", locale),
  add: (locale: string, variantId: string, quantity = 1) => call("POST", "/items", locale, { variantId, quantity }),
  update: (locale: string, itemId: string, patch: { quantity?: number; variantId?: string }) => call("PATCH", `/items/${itemId}`, locale, patch),
  remove: (locale: string, itemId: string) => call("DELETE", `/items/${itemId}`, locale),
  applyCoupon: (locale: string, code: string) => call("POST", "/coupon", locale, { code }),
  removeCoupon: (locale: string) => call("DELETE", "/coupon", locale),
};
