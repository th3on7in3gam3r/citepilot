import type { AbstractIntlMessages } from "next-intl";

/** Namespaces consumed by client components via useTranslations(). */
const CLIENT_NAMESPACES = [
  "nav",
  "languageSwitcher",
  "platforms",
  "pricing",
  "features",
] as const;

/** Strip server-only namespaces to shrink the RSC payload in root layout. */
export function pickClientMessages(
  messages: AbstractIntlMessages,
): AbstractIntlMessages {
  const picked: AbstractIntlMessages = {};
  for (const ns of CLIENT_NAMESPACES) {
    if (messages[ns] !== undefined) {
      picked[ns] = messages[ns];
    }
  }
  return picked;
}
