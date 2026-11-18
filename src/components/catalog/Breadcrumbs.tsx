import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export interface Crumb {
  name: string;
  /** Путь без локали; у последнего элемента не указывается */
  href?: string;
}

/** Хлебные крошки + JSON-LD BreadcrumbList для поисковиков. */
export async function Breadcrumbs({ items, locale, className = "" }: { items: Crumb[]; locale?: string; className?: string }) {
  const t = await getTranslations("nav");
  const base = (process.env.APP_URL || process.env.RENDER_EXTERNAL_URL) ?? "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      ...(c.href && locale ? { item: `${base}/${locale}${c.href === "/" ? "" : c.href}` } : {}),
    })),
  };
  return (
    <nav aria-label={t("breadcrumbs")} className={className}>
      <ol className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden>/</span>}
            {c.href ? (
              <Link href={c.href} className="link-underline">{c.name}</Link>
            ) : (
              <span aria-current="page" className="text-ink">{c.name}</span>
            )}
          </li>
        ))}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </nav>
  );
}
