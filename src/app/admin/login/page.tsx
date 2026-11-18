import { redirect } from "next/navigation";
import Image from "next/image";
import { getSessionUser } from "@/features/auth/session";
import { AdminLoginForm } from "./AdminLoginForm";
import logoCream from "../../../../public/brand/logo-cream.png";

export const dynamic = "force-dynamic";
export const metadata = { title: "Вход" };

export default async function AdminLoginPage() {
  const user = await getSessionUser();
  if (user?.can("admin:access")) redirect("/admin");
  return (
    <main className="velvet flex min-h-svh items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <Image src={logoCream} alt="FABIANO" priority className="mx-auto h-auto w-56" />
        <p className="eyebrow mt-6 text-center text-champagne">Панель управления</p>
        <div className="mt-10 bg-canvas p-7 shadow-2xl">
          <AdminLoginForm />
        </div>
      </div>
    </main>
  );
}
