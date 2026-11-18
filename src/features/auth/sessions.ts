import "server-only";
import { randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, hashToken } from "./session";

const SESSION_DAYS = 30;

/** Новая серверная сессия: случайный токен в httpOnly cookie, в БД — только SHA-256. */
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const h = await headers();
  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000),
      userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
      ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    },
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}

/** При смене пароля — выходим со всех устройств, кроме текущего. */
export async function revokeOtherSessions(userId: string) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  await prisma.session.deleteMany({ where: { userId, ...(token ? { NOT: { tokenHash: hashToken(token) } } : {}) } });
}
