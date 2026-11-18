"use client";

import { useEffect } from "react";
import { reloadOnceForStaleDeploy, reportClientError } from "@/lib/client-error";

/** Ошибки вне React-дерева (обработчики, промисы) → перезагрузка при устаревшей версии или отчёт в логи. */
export function ErrorListener() {
  useEffect(() => {
    const handle = (err: unknown) => {
      const e = err instanceof Error ? err : new Error(String(err));
      if (!reloadOnceForStaleDeploy(e)) reportClientError(e);
    };
    const onError = (ev: ErrorEvent) => handle(ev.error ?? ev.message);
    const onRejection = (ev: PromiseRejectionEvent) => handle(ev.reason);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
