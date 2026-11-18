/**
 * Безопасный рендер простого текста страниц: "## " — подзаголовок, "- " — список, пустая строка — абзац.
 * Никакого HTML из БД: всё выводится как текст через React (XSS невозможен).
 */
export function SimpleText({ body, className = "" }: { body: string; className?: string }) {
  const blocks = body.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <div className={`space-y-5 text-[0.9375rem] leading-relaxed text-ink/85 ${className}`}>
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter(Boolean);
        const out: React.ReactNode[] = [];
        let list: string[] = [];
        const flush = (key: string) => {
          if (list.length) {
            out.push(
              <ul key={key} className="list-none space-y-2">
                {list.map((li, j) => (
                  <li key={j} className="flex gap-3"><span className="mt-[0.7em] h-px w-3 shrink-0 bg-accent" aria-hidden />{li}</li>
                ))}
              </ul>,
            );
            list = [];
          }
        };
        lines.forEach((line, j) => {
          if (line.startsWith("## ")) {
            flush(`l${j}`);
            out.push(<h2 key={j} className="pt-4 text-2xl text-ink md:text-3xl">{line.slice(3)}</h2>);
          } else if (line.startsWith("- ")) {
            list.push(line.slice(2));
          } else {
            flush(`l${j}`);
            out.push(<p key={j}>{line}</p>);
          }
        });
        flush("end");
        return <div key={i} className="space-y-3">{out}</div>;
      })}
    </div>
  );
}
