import { notFound } from "next/navigation";

/** Любой неизвестный путь внутри языка → фирменная локализованная 404 ([locale]/not-found.tsx), а не стандартная страница Next.js. */
export default function CatchAll() {
  notFound();
}
