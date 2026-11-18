import Image from "next/image";
import { Link } from "@/i18n/routing";
import logoCream from "../../../public/brand/logo-cream.png";
import logoWine from "../../../public/brand/logo-wine.png";

/**
 * Фирменный логотип FABIANO (вышивка с иглой), вырезанный на прозрачный фон.
 * cream — для бордовых фонов (шапка, подвал, первый экран), wine — для светлых.
 * Загруженный в Dashboard логотип (logoUrl) заменяет встроенный.
 */
export function Logo({
  logoUrl,
  tone = "cream",
  className = "h-11 w-auto md:h-[3.25rem]",
  priority = true,
}: {
  logoUrl?: string | null;
  tone?: "cream" | "wine";
  className?: string;
  priority?: boolean;
}) {
  return (
    <Link href="/" aria-label="FABIANO" className="inline-flex shrink-0 items-center">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- логотип из настроек магазина, размер задаётся CSS
        <img src={logoUrl} alt="FABIANO" className={className} />
      ) : (
        <Image src={tone === "cream" ? logoCream : logoWine} alt="FABIANO" priority={priority} className={className} sizes="240px" />
      )}
    </Link>
  );
}
