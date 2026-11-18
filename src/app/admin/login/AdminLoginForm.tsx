"use client";

import { useActionState } from "react";
import { adminLoginAction } from "@/features/admin/auth-actions";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLoginAction, null);
  const input = "field mt-1.5";
  return (
    <form action={action} className="space-y-5">
      <label className="block">
        <span className="text-xs font-medium text-muted">Email</span>
        <input name="email" type="email" required autoComplete="username" className={input} />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-muted">Parol</span>
        <input name="password" type="password" required autoComplete="current-password" className={input} />
      </label>
      {state?.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-full disabled:opacity-50">Kirish</button>
    </form>
  );
}
