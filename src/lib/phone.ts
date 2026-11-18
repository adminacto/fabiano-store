/**
 * Телефоны Узбекистана: приводим любой ввод к E.164 (+998XXXXXXXXX).
 * Принимает: "+998 (90) 123-45-67", "998901234567", "90 123 45 67", "901234567".
 */

const UZ_OPERATOR_CODES = new Set([
  "20", "33", "50", "55", "61", "62", "65", "66", "67", "69", "70", "71", "72", "73", "74", "75", "76", "77", "78", "79",
  "88", "90", "91", "93", "94", "95", "97", "98", "99",
]);

export function normalizeUzPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let national: string;
  if (digits.length === 12 && digits.startsWith("998")) national = digits.slice(3);
  else if (digits.length === 9) national = digits;
  else return null;
  if (!UZ_OPERATOR_CODES.has(national.slice(0, 2))) return null;
  return `+998${national}`;
}

/** +998901234567 → "+998 90 123 45 67" */
export function formatUzPhone(e164: string): string {
  const m = /^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(e164);
  return m ? `+998 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : e164;
}
