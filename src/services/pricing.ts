/**
 * Расчёт корзины и заказа. Единственный источник истины для сумм:
 * используется в корзине, checkout и при создании заказа на сервере.
 * Клиент никогда не присылает цены — только variantId и количество.
 */
import { floorToWholeSum, fromMinor, minMinor, toMinor, type Minor } from "../lib/money";

export const MAX_QTY_PER_LINE = 99;

export interface PricedLine {
  variantId: string;
  unitPrice: string; // Decimal string
  quantity: number;
  /** quantity − reserved на складе в момент расчёта */
  available: number;
}

export interface CouponRule {
  code: string;
  type: "PERCENT" | "FIXED";
  value: string;
  minOrderAmount?: string | null;
  maxDiscount?: string | null;
  startsAt?: Date | null;
  expiresAt?: Date | null;
  isActive: boolean;
  usageLimit?: number | null;
  usedCount: number;
  perUserLimit?: number | null;
  /** Сколько раз этот покупатель (userId или телефон) уже использовал купон */
  customerUsageCount: number;
}

export interface DeliveryRule {
  price: string;
  freeFrom?: string | null;
}

export type CouponError =
  | "INACTIVE"
  | "NOT_STARTED"
  | "EXPIRED"
  | "USAGE_LIMIT_REACHED"
  | "CUSTOMER_LIMIT_REACHED"
  | "MIN_ORDER_NOT_MET";

export type StockError = { variantId: string; requested: number; available: number };

export interface Totals {
  subtotal: string;
  discount: string;
  shipping: string;
  grandTotal: string;
  itemCount: number;
  appliedCoupon: string | null;
  couponError: CouponError | null;
  stockErrors: StockError[];
}

export function validateCoupon(c: CouponRule, subtotal: Minor, now: Date): CouponError | null {
  if (!c.isActive) return "INACTIVE";
  if (c.startsAt && now < c.startsAt) return "NOT_STARTED";
  if (c.expiresAt && now >= c.expiresAt) return "EXPIRED";
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) return "USAGE_LIMIT_REACHED";
  if (c.perUserLimit != null && c.customerUsageCount >= c.perUserLimit) return "CUSTOMER_LIMIT_REACHED";
  if (c.minOrderAmount && subtotal < toMinor(c.minOrderAmount)) return "MIN_ORDER_NOT_MET";
  return null;
}

export function couponDiscount(c: CouponRule, subtotal: Minor): Minor {
  let d: Minor;
  if (c.type === "PERCENT") {
    d = floorToWholeSum((subtotal * toMinor(c.value)) / 10000n); // value в процентах, toMinor ×100
    if (c.maxDiscount) d = minMinor(d, toMinor(c.maxDiscount));
  } else {
    d = toMinor(c.value);
  }
  return minMinor(d, subtotal); // скидка не больше суммы товаров
}

export function calculateTotals(input: {
  lines: PricedLine[];
  coupon?: CouponRule | null;
  delivery?: DeliveryRule | null;
  now?: Date;
}): Totals {
  const now = input.now ?? new Date();
  const stockErrors: StockError[] = [];
  let subtotal = 0n;
  let itemCount = 0;

  for (const l of input.lines) {
    if (!Number.isInteger(l.quantity) || l.quantity < 1 || l.quantity > MAX_QTY_PER_LINE) {
      throw new Error(`Invalid quantity for ${l.variantId}: ${l.quantity}`);
    }
    if (l.quantity > l.available) {
      stockErrors.push({ variantId: l.variantId, requested: l.quantity, available: Math.max(0, l.available) });
    }
    subtotal += toMinor(l.unitPrice) * BigInt(l.quantity);
    itemCount += l.quantity;
  }

  let discount = 0n;
  let couponError: CouponError | null = null;
  let appliedCoupon: string | null = null;
  if (input.coupon) {
    couponError = validateCoupon(input.coupon, subtotal, now);
    if (!couponError) {
      discount = couponDiscount(input.coupon, subtotal);
      appliedCoupon = input.coupon.code;
    }
  }

  let shipping = 0n;
  if (input.delivery && input.lines.length > 0) {
    const afterDiscount = subtotal - discount;
    const free = input.delivery.freeFrom != null && afterDiscount >= toMinor(input.delivery.freeFrom);
    shipping = free ? 0n : toMinor(input.delivery.price);
  }

  return {
    subtotal: fromMinor(subtotal),
    discount: fromMinor(discount),
    shipping: fromMinor(shipping),
    grandTotal: fromMinor(subtotal - discount + shipping),
    itemCount,
    appliedCoupon,
    couponError,
    stockErrors,
  };
}
