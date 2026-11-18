import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "fb_session";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Текущий пользователь по серверной сессии. В cookie — случайный токен, в БД — его SHA-256.
 * Вход/регистрация, создающие сессию, — в PHASE 3 (features/auth/actions.ts).
 */
export const getSessionUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length < 32) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { roles: { include: { role: true } } } } },
  });
  if (!session || session.expiresAt < new Date() || !session.user.isActive) return null;
  const permissions = new Set(session.user.roles.flatMap((r) => r.role.permissions));
  return {
    id: session.user.id,
    email: session.user.email,
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    phone: session.user.phone,
    can: (perm: string) => permissions.has("*") || permissions.has(perm),
  };
});

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;
