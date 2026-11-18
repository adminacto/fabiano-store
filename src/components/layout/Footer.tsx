import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { NewsletterForm } from "@/components/home/NewsletterForm";

interface FooterProps {
  socials?: { instagram?: string; telegram?: string } | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
}

export async function Footer({ socials, contactPhone, contactEmail }: FooterProps) {
  const t = await getTranslations("footer");
  const tn = await getTranslations("newsletter");
  const year = new Date().getFullYear();

  const help = [
    { href: "/pages/contact", label: t("contact") },
    { href: "/pages/faq", label: t("faq") },
    { href: "/pages/shipping-returns", label: t("shipping") },
  ];
  const company = [
    { href: "/pages/about", label: t("about") },
    { href: "/pages/privacy", label: t("privacy") },
    { href: "/pages/terms", label: t("terms") },
  ];

  return (
    <footer className="mt-24 border-t border-line bg-paper md:mt-32">
      <div className="page-x mx-auto grid max-w-[var(--container-page)] gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-5">
          <p className="font-serif text-3xl tracking-[0.3em]">FABIANO</p>
          <p className="mt-6 max-w-sm text-sm text-muted">{tn("text")}</p>
          <NewsletterForm compact source="footer" className="mt-6 max-w-sm" />
        </div>

        <FooterColumn title={t("help")} links={help} className="md:col-span-2 md:col-start-7" />
        <FooterColumn title={t("company")} links={company} className="md:col-span-2" />

        <div className="md:col-span-2">
          <h2 className="eyebrow font-sans text-muted">{t("follow")}</h2>
          <ul className="mt-5 space-y-3 text-sm">
            {socials?.instagram && (
              <li><a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="link-underline">Instagram</a></li>
            )}
            {socials?.telegram && (
              <li><a href={socials.telegram} target="_blank" rel="noopener noreferrer" className="link-underline">Telegram</a></li>
            )}
            {contactPhone && (
              <li><a href={`tel:${contactPhone}`} className="link-underline price">{contactPhone}</a></li>
            )}
            {contactEmail && (
              <li><a href={`mailto:${contactEmail}`} className="link-underline">{contactEmail}</a></li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="page-x mx-auto max-w-[var(--container-page)] py-6 text-xs text-muted">
          © {year} FABIANO. {t("rights")}
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links, className }: { title: string; links: { href: string; label: string }[]; className?: string }) {
  return (
    <div className={className}>
      <h2 className="eyebrow font-sans text-muted">{title}</h2>
      <ul className="mt-5 space-y-3 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="link-underline">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
