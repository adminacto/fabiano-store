import { test } from "node:test";
import assert from "node:assert/strict";
import { toMinor, fromMinor, formatMoney, discountPercent } from "../../src/lib/money";
import { normalizeUzPhone, formatUzPhone } from "../../src/lib/phone";
import { calculateTotals, type CouponRule } from "../../src/services/pricing";
import { mergeCarts } from "../../src/services/cart-merge";
import { formatOrderNumber, canTransition } from "../../src/features/orders/order-number";

const NB = " ";

test("money: точная арифметика без float", () => {
  assert.equal(toMinor("289000.00"), 28900000n);
  assert.equal(toMinor("0.1") + toMinor("0.2"), toMinor("0.3"));
  assert.equal(fromMinor(28900050n), "289000.50");
  assert.throws(() => toMinor("12.345"));
  assert.throws(() => toMinor("abc"));
});

test("money: формат по локали", () => {
  assert.equal(formatMoney("289000.00", "uz"), `289${NB}000${NB}soʻm`);
  assert.equal(formatMoney("289000.00", "ru"), `289${NB}000${NB}сум`);
  assert.equal(formatMoney("1289000.00", "en"), `UZS${NB}1,289,000`);
  assert.equal(formatMoney("950.00", "ru"), `950${NB}сум`);
});

test("money: процент скидки", () => {
  assert.equal(discountPercent("289000", "349000"), 17);
  assert.equal(discountPercent("289000", null), null);
  assert.equal(discountPercent("289000", "289000"), null);
});

test("phone: нормализация +998", () => {
  for (const v of ["+998 (90) 123-45-67", "998901234567", "90 123 45 67", "901234567"]) {
    assert.equal(normalizeUzPhone(v), "+998901234567", v);
  }
  assert.equal(normalizeUzPhone("+7 900 123 45 67"), null);
  assert.equal(normalizeUzPhone("12345"), null);
  assert.equal(normalizeUzPhone("001234567"), null); // несуществующий код оператора
  assert.equal(formatUzPhone("+998901234567"), "+998 90 123 45 67");
});

const lines = [
  { variantId: "a", unitPrice: "289000.00", quantity: 2, available: 5 },
  { variantId: "b", unitPrice: "159000.00", quantity: 1, available: 1 },
];
const now = new Date("2026-11-18T10:00:00Z");
const coupon = (over: Partial<CouponRule> = {}): CouponRule => ({
  code: "FAB10", type: "PERCENT", value: "10", isActive: true, usedCount: 0, customerUsageCount: 0, ...over,
});

test("pricing: пересчёт суммы", () => {
  const t = calculateTotals({ lines, now });
  assert.equal(t.subtotal, "737000.00");
  assert.equal(t.grandTotal, "737000.00");
  assert.equal(t.itemCount, 3);
  assert.deepEqual(t.stockErrors, []);
});

test("pricing: процентный промокод + доставка", () => {
  const t = calculateTotals({ lines, coupon: coupon(), delivery: { price: "30000.00" }, now });
  assert.equal(t.discount, "73700.00");
  assert.equal(t.shipping, "30000.00");
  assert.equal(t.grandTotal, "693300.00");
  assert.equal(t.appliedCoupon, "FAB10");
});

test("pricing: процентная скидка округляется вниз до целого сума и ограничена maxDiscount", () => {
  const t = calculateTotals({ lines: [{ variantId: "x", unitPrice: "99999.00", quantity: 1, available: 1 }], coupon: coupon({ value: "15" }), now });
  assert.equal(t.discount, "14999.00"); // 14999.85 → 14999
  const capped = calculateTotals({ lines, coupon: coupon({ value: "50", maxDiscount: "100000" }), now });
  assert.equal(capped.discount, "100000.00");
});

test("pricing: фиксированная скидка не больше суммы товаров", () => {
  const t = calculateTotals({ lines: [{ variantId: "x", unitPrice: "50000.00", quantity: 1, available: 1 }], coupon: coupon({ type: "FIXED", value: "80000" }), now });
  assert.equal(t.discount, "50000.00");
  assert.equal(t.grandTotal, "0.00");
});

test("pricing: бесплатная доставка от суммы после скидки", () => {
  const free = calculateTotals({ lines, delivery: { price: "30000", freeFrom: "500000" }, now });
  assert.equal(free.shipping, "0.00");
  const notFree = calculateTotals({ lines, coupon: coupon({ type: "FIXED", value: "300000" }), delivery: { price: "30000", freeFrom: "500000" }, now });
  assert.equal(notFree.shipping, "30000.00");
});

test("pricing: ошибки промокода", () => {
  const cases: [Partial<CouponRule>, string][] = [
    [{ isActive: false }, "INACTIVE"],
    [{ startsAt: new Date("2026-12-01") }, "NOT_STARTED"],
    [{ expiresAt: new Date("2026-11-01") }, "EXPIRED"],
    [{ usageLimit: 100, usedCount: 100 }, "USAGE_LIMIT_REACHED"],
    [{ perUserLimit: 1, customerUsageCount: 1 }, "CUSTOMER_LIMIT_REACHED"],
    [{ minOrderAmount: "1000000" }, "MIN_ORDER_NOT_MET"],
  ];
  for (const [over, err] of cases) {
    const t = calculateTotals({ lines, coupon: coupon(over), now });
    assert.equal(t.couponError, err);
    assert.equal(t.discount, "0.00");
  }
});

test("pricing: превышение остатка возвращается как ошибка склада", () => {
  const t = calculateTotals({ lines: [{ variantId: "a", unitPrice: "1000", quantity: 3, available: 2 }], now });
  assert.deepEqual(t.stockErrors, [{ variantId: "a", requested: 3, available: 2 }]);
  assert.throws(() => calculateTotals({ lines: [{ variantId: "a", unitPrice: "1000", quantity: 0, available: 2 }] }));
  assert.throws(() => calculateTotals({ lines: [{ variantId: "a", unitPrice: "1000", quantity: 1.5, available: 2 }] }));
});

test("cart merge: суммирует и обрезает по складу", () => {
  const stock: Record<string, number> = { a: 3, b: 10, c: 0 };
  const r = mergeCarts([{ variantId: "a", quantity: 2 }, { variantId: "b", quantity: 1 }], [{ variantId: "a", quantity: 2 }, { variantId: "c", quantity: 1 }], (id) => stock[id]);
  assert.deepEqual(r.items, [{ variantId: "a", quantity: 3 }, { variantId: "b", quantity: 1 }]);
  assert.deepEqual(r.adjusted, [{ variantId: "a", requested: 4, kept: 3 }, { variantId: "c", requested: 1, kept: 0 }]);
});

test("orders: номер и переходы статусов", () => {
  assert.equal(formatOrderNumber(2026, 123), "FB-2026-000123");
  assert.ok(canTransition("PENDING", "CONFIRMED"));
  assert.ok(canTransition("SHIPPED", "DELIVERED"));
  assert.ok(!canTransition("DELIVERED", "PENDING"));
  assert.ok(!canTransition("CANCELLED", "CONFIRMED"));
});
