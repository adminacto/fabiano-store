"use client";

import { useEffect, useState } from "react";
import { CART_EVENT } from "@/features/cart/client";

/** Счётчик товаров: загружается после гидрации (страницы остаются кэшируемыми) и обновляется событием корзины. */
export function CartCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch("/api/v1/cart/count", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { count: 0 }))
      .then((d: { count: number }) => alive && setCount(d.count))
      .catch(() => undefined);
    const onUpdate = (e: Event) => setCount((e as CustomEvent<{ count: number }>).detail.count);
    window.addEventListener(CART_EVENT, onUpdate);
    return () => {
      alive = false;
      window.removeEventListener(CART_EVENT, onUpdate);
    };
  }, []);

  if (count === 0) return null;
  return (
    <span className="price absolute right-1 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[0.5625rem] font-semibold text-paper">
      {count > 99 ? "99+" : count}
    </span>
  );
}
