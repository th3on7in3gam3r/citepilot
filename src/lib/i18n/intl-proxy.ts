import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { shouldRunIntl } from "@/lib/i18n/intl-paths";

export const intlMiddleware = createIntlMiddleware(routing);

export { shouldRunIntl } from "@/lib/i18n/intl-paths";
