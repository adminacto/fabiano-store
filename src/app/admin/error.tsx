"use client";

import { ErrorView } from "@/components/ui/ErrorView";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorView
      error={error}
      reset={reset}
      title="Xatolik yuz berdi"
      text="Sahifani yuklab boʻlmadi. Qayta urinib koʻring — muammo takrorlansa, xato maʼlumoti serverga yuborildi."
      retry="Qayta urinish"
      home="Boshqaruv paneli"
      homeHref="/admin"
    />
  );
}
