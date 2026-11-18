/**
 * Слияние гостевой корзины с корзиной пользователя после входа.
 * Количество суммируется и обрезается по складу и лимиту строки; недоступные позиции отбрасываются
 * и возвращаются отдельно, чтобы показать покупателю уведомление.
 */
import { MAX_QTY_PER_LINE } from "./pricing";

export interface CartLine {
  variantId: string;
  quantity: number;
}

export interface MergeResult {
  items: CartLine[];
  adjusted: { variantId: string; requested: number; kept: number }[];
}

export function mergeCarts(
  userItems: CartLine[],
  guestItems: CartLine[],
  available: (variantId: string) => number,
): MergeResult {
  const totals = new Map<string, number>();
  for (const l of [...userItems, ...guestItems]) {
    totals.set(l.variantId, (totals.get(l.variantId) ?? 0) + l.quantity);
  }
  const items: CartLine[] = [];
  const adjusted: MergeResult["adjusted"] = [];
  for (const [variantId, requested] of totals) {
    const kept = Math.max(0, Math.min(requested, available(variantId), MAX_QTY_PER_LINE));
    if (kept !== requested) adjusted.push({ variantId, requested, kept });
    if (kept > 0) items.push({ variantId, quantity: kept });
  }
  return { items, adjusted };
}
