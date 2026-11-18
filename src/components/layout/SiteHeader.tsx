import { Header } from "./Header";
import { getStoreSettings } from "@/services/catalog";
import { mediaUrl } from "@/lib/media";
import { locales, type AppLocale } from "@/i18n/routing";

/** Server-обёртка: подтягивает логотип и включённые языки из StoreSettings. */
export async function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const settings = await getStoreSettings().catch(() => null);
  const enabled = (settings?.enabledLocales?.length ? settings.enabledLocales : locales) as readonly AppLocale[];
  return <Header overlay={overlay} logoUrl={mediaUrl(settings?.logoKey)} enabledLocales={enabled} />;
}
