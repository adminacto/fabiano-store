import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

/** Две большие плитки-входа в каталог. Без фото — бархат и типографика, с фото коллекций — тот же размер. */
export async function GenderTiles() {
  const t = await getTranslations("home");
  const tiles = [
    { href: "/men", title: t("menTitle"), text: t("menText"), n: "01" },
    { href: "/women", title: t("womenTitle"), text: t("womenText"), n: "02" },
  ];
  return (
    <section id="after-hero" className="page-x mx-auto mt-3 grid max-w-[var(--container-page)] gap-3 md:mt-5 md:grid-cols-2 md:gap-5">
      {tiles.map((tile) => (
        <Link
          key={tile.href}
          href={tile.href}
          className="velvet on-dark group relative flex min-h-[15rem] flex-col justify-between overflow-hidden p-7 text-cream md:min-h-[24rem] md:p-10"
        >
          <span className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[radial-gradient(closest-side,rgb(205_174_143/0.18),transparent)] transition-transform duration-[1200ms] ease-[var(--ease-fabiano)] group-hover:scale-150" aria-hidden />
          <span className="price relative text-xs text-champagne">{tile.n}</span>
          <div className="relative">
            <h2 className="text-5xl md:text-7xl">{tile.title}</h2>
            <p className="mt-3 max-w-xs text-sm text-cream/70">{tile.text}</p>
            <span className="eyebrow mt-6 inline-flex items-center gap-3 border-b border-cream/50 pb-1 transition-[gap] duration-500 group-hover:gap-5">
              {t("shopNow")} <span aria-hidden>→</span>
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}
