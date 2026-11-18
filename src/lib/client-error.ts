"use client";

/** Ошибка загрузки файлов старой версии после деплоя — лечится перезагрузкой страницы. */
export function isStaleDeployError(error: Error): boolean {
  const s = `${error.name} ${error.message}`;
  return /ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported module|Failed to fetch dynamically|Failed to find Server Action|This request might be from an older or newer deployment/i.test(s);
}

/** Один автоматический reload на адрес (защита от бесконечного цикла). */
export function reloadOnceForStaleDeploy(error: Error): boolean {
  if (!isStaleDeployError(error) || typeof window === "undefined") return false;
  const key = `fb-reload:${location.pathname}`;
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, String(Date.now()));
  } catch {
    /* sessionStorage недоступен — всё равно пробуем один раз */
  }
  window.location.reload();
  return true;
}

export function reportClientError(error: Error & { digest?: string }) {
  try {
    const body = JSON.stringify({
      message: String(error.message ?? "").slice(0, 1000),
      name: error.name,
      digest: error.digest,
      stack: error.stack?.slice(0, 4000),
      url: location.href.slice(0, 500),
      userAgent: navigator.userAgent.slice(0, 400),
    });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/client-errors", new Blob([body], { type: "application/json" }));
    else void fetch("/api/client-errors", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
  } catch {
    /* отчёт об ошибке не должен ломать страницу */
  }
}
