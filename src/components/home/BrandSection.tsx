export function BrandSection({ title, text }: { title: string; text: string }) {
  return (
    <section className="page-x mx-auto mt-24 max-w-[var(--container-page)] md:mt-36">
      <div className="mx-auto max-w-4xl border-y border-line py-16 text-center md:py-24">
        <span className="mx-auto block h-10 w-px bg-accent" aria-hidden />
        <h2 className="mt-8 text-4xl leading-[1.05] md:text-6xl">{title}</h2>
        <p className="mx-auto mt-6 max-w-lg text-base text-muted md:text-lg">{text}</p>
      </div>
    </section>
  );
}
