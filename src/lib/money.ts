/**
 * Денежная арифметика без float.
 * Внутри — bigint в минимальных единицах (тийин, 1 сум = 100 тийин).
 * Снаружи — строки Decimal из Prisma ("289000.00").
 */

export type Locale = "uz" | "ru" | "en";
export type Minor = bigint;

const DECIMAL_RE = /^-?\d+(\.\d{1,2})?$/;

export function toMinor(amount: string | number): Minor {
  const s = typeof amount === "number" ? amount.toFixed(2) : amount.trim();
  if (!DECIMAL_RE.test(s)) throw new Error(`Invalid money amount: ${amount}`);
  const negative = s.startsWith("-");
  const [int = "0", frac = ""] = s.replace("-", "").split(".");
  const value = BigInt(int) * 100n + BigInt((frac + "00").slice(0, 2));
  return negative ? -value : value;
}

export function fromMinor(minor: Minor): string {
  const negative = minor < 0n;
  const abs = negative ? -minor : minor;
  const int = abs / 100n;
  const frac = (abs % 100n).toString().padStart(2, "0");
  return `${negative ? "-" : ""}${int}.${frac}`;
}

/** Округление вниз до целого сума — скидки никогда не дают дробных тийинов. */
export function floorToWholeSum(minor: Minor): Minor {
  return minor - (minor % 100n);
}

export function minMinor(a: Minor, b: Minor): Minor {
  return a < b ? a : b;
}

const NBSP = " ";

function group(intPart: string, sep: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

const CURRENCY_LABEL: Record<string, Record<Locale, string>> = {
  UZS: { uz: "soʻm", ru: "сум", en: "UZS" },
};

/**
 * 289000 → "289 000 soʻm" (uz) · "289 000 сум" (ru) · "UZS 289,000" (en).
 * Детерминированно, не зависит от версии ICU в Node/браузере (важно для SSR-гидрации).
 */
export function formatMoney(amount: string | Minor, locale: Locale, currency = "UZS"): string {
  const minor = typeof amount === "bigint" ? amount : toMinor(amount);
  const negative = minor < 0n;
  const abs = negative ? -minor : minor;
  const int = (abs / 100n).toString();
  const frac = abs % 100n;
  const label = CURRENCY_LABEL[currency]?.[locale] ?? currency;
  const sign = negative ? "−" : "";

  if (locale === "en") {
    const num = group(int, ",") + (frac ? "." + frac.toString().padStart(2, "0") : "");
    return `${sign}${label}${NBSP}${num}`;
  }
  const num = group(int, NBSP) + (frac ? "," + frac.toString().padStart(2, "0") : "");
  return `${sign}${num}${NBSP}${label}`;
}

/** Процент скидки для бейджа: compareAt 349000, price 289000 → 17. */
export function discountPercent(price: string, compareAt: string | null | undefined): number | null {
  if (!compareAt) return null;
  const p = toMinor(price);
  const c = toMinor(compareAt);
  if (c <= p || c === 0n) return null;
  return Number(((c - p) * 100n) / c);
}
