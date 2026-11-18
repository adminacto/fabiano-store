"use client";

import { useEffect, useState } from "react";
import { reloadOnceForStaleDeploy, reportClientError } from "@/lib/client-error";

/** Общий экран ошибки: при устаревшей версии сайта — тихая перезагрузка, иначе отчёт в логи + кнопки. */
export function ErrorView({
  error, reset, title, text, retry, home, homeHref,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
  text: string;
  retry: string;
  home: string;
  homeHref: string;
}) {
  const [reloading, setReloading] = useState(false);
  useEffect(() => {
    if (reloadOnceForStaleDeploy(error)) {
      setReloading(true);
      return;
    }
    reportClientError(error);
  }, [error]);

  if (reloading) return <div className="min-h-[60svh]" aria-busy="true" />;

  return (
    <main id="main" className="page-x mx-auto flex min-h-[70svh] max-w-xl flex-col items-center justify-center py-16 text-center">
      <span className="h-10 w-px bg-accent" aria-hidden />
      <h1 className="mt-6 text-4xl md:text-5xl">{title}</h1>
      <p className="mt-4 text-muted">{text}</p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={() => { reset(); window.location.reload(); }} className="btn btn-primary">{retry}</button>
        <a href={homeHref} className="btn btn-outline">{home}</a>
      </div>
      {error.digest && <p className="mt-6 text-xs text-muted">ID: {error.digest}</p>}
    </main>
  );
}
