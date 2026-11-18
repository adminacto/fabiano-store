/**
 * HMAC-подпись значений в cookie (id гостевой корзины).
 * Подделать или подобрать чужой cartId нельзя: без секрета подпись не сойдётся.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

function mac(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function signValue(value: string, secret: string): string {
  if (!secret || secret.length < 32) throw new Error("Signing secret must be at least 32 characters");
  if (value.includes(".")) throw new Error("Value must not contain '.'");
  return `${value}.${mac(value, secret)}`;
}

export function verifySignedValue(signed: string | undefined | null, secret: string): string | null {
  if (!signed || !secret) return null;
  const i = signed.lastIndexOf(".");
  if (i <= 0) return null;
  const value = signed.slice(0, i);
  const given = Buffer.from(signed.slice(i + 1));
  const expected = Buffer.from(mac(value, secret));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return value;
}
