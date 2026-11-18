"use server";

import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { isLocale } from "@/i18n/routing";

export type NewsletterState = { status: "idle" | "success" | "already" | "invalid" | "rateLimited" | "error" };

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  source: z.enum(["footer", "home", "checkout"]).default("home"),
  // honeypot: боты заполняют скрытое поле
  company: z.string().max(0).optional().or(z.literal("")),
});

export async function subscribeToNewsletter(_prev: NewsletterState, form: FormData): Promise<NewsletterState> {
  const parsed = schema.safeParse({
    email: form.get("email"),
    source: form.get("source") ?? undefined,
    company: form.get("company") ?? "",
  });
  if (!parsed.success) return { status: "invalid" };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (!rateLimit(`newsletter:${ip}`, 5, 600).ok) return { status: "rateLimited" };

  const locale = await getLocale();
  try {
    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: parsed.data.email } });
    if (existing && !existing.unsubscribedAt) return { status: "already" };

    const tokenHash = createHash("sha256").update(randomBytes(32)).digest("hex");
    await prisma.newsletterSubscriber.upsert({
      where: { email: parsed.data.email },
      create: {
        email: parsed.data.email,
        locale: isLocale(locale) ? locale : "uz",
        source: parsed.data.source,
        unsubscribeTokenHash: tokenHash,
      },
      update: { unsubscribedAt: null, unsubscribeTokenHash: tokenHash, source: parsed.data.source },
    });
    return { status: "success" };
  } catch (err) {
    console.error("[newsletter] subscribe failed", err instanceof Error ? err.message : err);
    return { status: "error" };
  }
}
