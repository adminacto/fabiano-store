import { Link } from "@/i18n/routing";

/**
 * Текстовый wordmark. Если в StoreSettings загружен логотип (SVG/PNG), Header передаёт его через logoUrl.
 */
export function Logo({ logoUrl, className = "" }: { logoUrl?: string | null; className?: string }) {
  return (
    <Link href="/" aria-label="FABIANO" className={`inline-flex items-center ${className}`}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- SVG-логотип из настроек, размеры задаются CSS
        <img src={logoUrl} alt="FABIANO" className="h-6 w-auto md:h-7" />
      ) : (
        <span className="font-serif text-[1.65rem] leading-none tracking-[0.32em] md:text-[1.85rem]">FABIANO</span>
      )}
    </Link>
  );
}
