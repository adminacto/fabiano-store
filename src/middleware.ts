import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Всё, кроме API, админки, служебных файлов Next и статики
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
