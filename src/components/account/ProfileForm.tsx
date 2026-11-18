"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updateProfileAction } from "@/features/auth/actions";
import { Field } from "./AuthForms";

export function ProfileForm({ firstName, lastName, phone, email }: { firstName: string | null; lastName: string | null; phone: string | null; email: string | null }) {
  const t = useTranslations("account");
  const [state, action, pending] = useActionState(updateProfileAction, null);
  const err = state?.error ? (t.has(`errors.${state.error}`) ? t(`errors.${state.error}` as "errors.GENERIC") : t("errors.GENERIC")) : null;
  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("firstName")} name="firstName" defaultValue={firstName} autoComplete="given-name" />
        <Field label={t("lastName")} name="lastName" defaultValue={lastName} autoComplete="family-name" />
      </div>
      <Field label={`${t("phone")} (${t("optional")})`} name="phone" type="tel" inputMode="tel" defaultValue={phone} required={false} placeholder="+998 90 123 45 67" />
      <p className="text-sm text-muted">{t("email")}: <span className="text-ink">{email}</span></p>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-50">{t("save")}</button>
        <p role="status" className={`text-sm ${err ? "text-danger" : "text-success"}`}>{err ?? (state?.fields?.saved ? t("saved") : "")}</p>
      </div>
    </form>
  );
}
