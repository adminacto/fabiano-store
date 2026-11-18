"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("state");
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="page-x mx-auto flex min-h-[70svh] max-w-xl flex-col items-center justify-center text-center">
      <h1 className="text-4xl md:text-5xl">{t("errorTitle")}</h1>
      <p className="mt-4 text-muted">{t("errorText")}</p>
      <button type="button" onClick={reset} className="btn btn-primary mt-10">{t("retry")}</button>
    </main>
  );
}
