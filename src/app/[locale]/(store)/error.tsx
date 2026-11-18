"use client";

import { useLocale, useTranslations } from "next-intl";
import { ErrorView } from "@/components/ui/ErrorView";

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("state");
  const locale = useLocale();
  return <ErrorView error={error} reset={reset} title={t("errorTitle")} text={t("errorText")} retry={t("retry")} home={t("backHome")} homeHref={`/${locale}`} />;
}
