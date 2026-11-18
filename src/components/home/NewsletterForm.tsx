"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { subscribeToNewsletter, type NewsletterState } from "@/features/newsletter/actions";
import { ArrowRightIcon } from "@/components/ui/icons";

export function NewsletterForm({
  source,
  compact = false,
  className = "",
}: {
  source: "footer" | "home";
  compact?: boolean;
  className?: string;
}) {
  const t = useTranslations("newsletter");
  const [state, action, pending] = useActionState<NewsletterState, FormData>(subscribeToNewsletter, { status: "idle" });
  const id = `newsletter-${source}`;
  const done = state.status === "success";
  const message = state.status === "idle" ? null : t(state.status);

  return (
    <form action={action} className={className} noValidate>
      <input type="hidden" name="source" value={source} />
      <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <label htmlFor={id} className="sr-only">{t("placeholder")}</label>
      <div className={`flex items-center border-b ${compact ? "border-current/40" : "border-current"}`}>
        <input
          id={id}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          disabled={done}
          placeholder={t("placeholder")}
          aria-describedby={message ? `${id}-msg` : undefined}
          aria-invalid={state.status === "invalid" || undefined}
          className="h-12 min-w-0 flex-1 bg-transparent text-[0.9375rem] placeholder:text-current placeholder:opacity-50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending || done}
          aria-label={t("submit")}
          className={compact ? "flex h-12 w-12 items-center justify-center" : "eyebrow h-12 pl-4"}
        >
          {compact ? <ArrowRightIcon width={20} height={20} /> : t("submit")}
        </button>
      </div>
      <p id={`${id}-msg`} role="status" aria-live="polite" className={`mt-3 min-h-5 text-xs ${done ? "" : "text-[#f2a7a7]"}`}>
        {message}
      </p>
    </form>
  );
}
