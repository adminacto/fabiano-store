"use client";

import { useActionState, useEffect, useRef } from "react";
import type { FormState } from "@/features/admin/auth-actions";

export const inputCls = "mt-1.5 h-11 w-full border border-line bg-paper px-3 text-sm focus:border-wine focus:outline-none";
export const labelCls = "block text-xs font-medium text-muted";

/** Форма админки с сообщением об успехе/ошибке. resetOnOk — очистить поля после успеха. */
export function ActionForm({
  action, children, className = "", submit, resetOnOk = false, encType,
}: {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
  submit: string;
  resetOnOk?: boolean;
  encType?: "multipart/form-data";
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnOk) ref.current?.reset();
  }, [state, resetOnOk]);
  return (
    <form ref={ref} action={formAction} className={className} encType={encType}>
      {children}
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-50">{pending ? "Сохранение…" : submit}</button>
        {state?.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
        {state?.ok && <p role="status" className="text-sm text-success">{state.ok}</p>}
      </div>
    </form>
  );
}

/** Кнопка с подтверждением без системного диалога: первый клик раскрывает «Точно?». */
export function ConfirmButton({ label, confirm, className = "" }: { label: string; confirm: string; className?: string }) {
  return (
    <details className={`group relative inline-block ${className}`}>
      <summary className="cursor-pointer list-none text-xs text-danger underline underline-offset-4 [&::-webkit-details-marker]:hidden">{label}</summary>
      <div className="absolute right-0 z-10 mt-2 w-56 border border-line bg-paper p-3 text-left shadow-lg">
        <p className="text-xs text-muted">{confirm}</p>
        <button type="submit" className="mt-3 h-9 w-full bg-danger text-xs font-semibold uppercase tracking-wider text-cream">{label}</button>
      </div>
    </details>
  );
}
