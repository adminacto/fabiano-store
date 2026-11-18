"use client";

import { useEffect } from "react";
import { reloadOnceForStaleDeploy, reportClientError } from "@/lib/client-error";

/** Последний рубеж: ошибка в корневом layout. Без шрифтов и провайдеров — только встроенные стили. */
export default function GlobalError({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (!reloadOnceForStaleDeploy(error)) reportClientError(error);
  }, [error]);
  return (
    <html lang="uz">
      <body style={{ margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#3a0a13", color: "#f1e2d3", fontFamily: "Georgia, serif", textAlign: "center", padding: 24 }}>
        <div>
          <p style={{ letterSpacing: "0.3em", fontSize: 14, opacity: 0.7 }}>FABIANO</p>
          <h1 style={{ fontWeight: 400, fontSize: 36, margin: "16px 0" }}>Xatolik yuz berdi</h1>
          <p style={{ opacity: 0.75, fontFamily: "system-ui, sans-serif" }}>Произошла ошибка · Something went wrong</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: 32, padding: "14px 32px", background: "#f1e2d3", color: "#3a0a13", border: 0, letterSpacing: "0.2em", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            QAYTA YUKLASH
          </button>
        </div>
      </body>
    </html>
  );
}
