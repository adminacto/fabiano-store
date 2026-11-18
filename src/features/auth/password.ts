import "server-only";
import { hash, verify } from "@node-rs/argon2";

// Параметры argon2id по рекомендации OWASP (19 MiB, 2 итерации)
const OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTS);
}

export async function verifyPassword(passwordHash: string | null | undefined, password: string): Promise<boolean> {
  if (!passwordHash) {
    // Выравниваем время ответа, чтобы по задержке нельзя было узнать, существует ли аккаунт
    await hash(password, OPTS);
    return false;
  }
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}
