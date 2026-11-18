"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getTryOnEngine } from "@/features/virtual-try-on/adapter";

/**
 * Показывается только когда сервер подтвердил флаги (env + магазин + товар).
 * Активна только если зарегистрирован движок Fabiano SDK и устройство его поддерживает.
 * Без SDK — никакой имитации примерки.
 *
 * Интерфейс примерки (камера, рендер) монтирует модуль-обёртка SDK вместе с registerTryOnEngine():
 * он слушает событие TRY_ON_OPEN_EVENT. Поэтому кнопка активна ровно тогда, когда есть кому её обработать.
 */
export const TRY_ON_OPEN_EVENT = "fabiano:try-on-open";

export interface TryOnOpenDetail {
  productId: string;
  colorCode: string | null;
  variantId: string | null;
}

export function TryOnButton(detail: TryOnOpenDetail) {
  const t = useTranslations("product");
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const engine = getTryOnEngine();
    if (!engine) return setSupported(false);
    engine.isSupported().then(setSupported).catch(() => setSupported(false));
  }, []);

  return (
    <div>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent<TryOnOpenDetail>(TRY_ON_OPEN_EVENT, { detail }))}
        disabled={!supported}
        className="btn btn-outline w-full gap-3 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
        {t("tryOn")}
      </button>
      {supported === false && <p className="mt-2 text-xs text-muted">{t("tryOnNotReady")}</p>}
    </div>
  );
}
