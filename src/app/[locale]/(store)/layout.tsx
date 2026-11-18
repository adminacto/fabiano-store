import { Footer } from "@/components/layout/Footer";
import { getStoreSettings } from "@/services/catalog";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getStoreSettings().catch(() => null);
  return (
    <>
      {children}
      <Footer
        socials={settings?.socials as { instagram?: string; telegram?: string } | null}
        contactPhone={settings?.contactPhone}
        contactEmail={settings?.contactEmail}
      />
    </>
  );
}
