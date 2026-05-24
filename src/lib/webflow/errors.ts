/** Turn Webflow API errors into actionable setup steps. */
export function formatWebflowError(message: string): string {
  if (
    message.toLowerCase().includes("site is not published") ||
    message.toLowerCase().includes("conflict with server data")
  ) {
    return (
      "Your Webflow site must be published once before CMS items can go live. " +
      "Open Webflow → Publish (top right) → publish to the .webflow.io subdomain, then try again. " +
      "CitePilot will also auto-publish the site on the next attempt."
    );
  }

  const scopeMatch = message.match(/scopes - '([^']+)'/);
  if (!scopeMatch) return message;

  const missing = scopeMatch[1];
  const required =
    missing === "cms:write" || missing === "cms:read"
      ? "cms:write (required), cms:read (optional), sites:publish (optional — live site)"
      : missing;

  return (
    `Webflow token is missing "${missing}". Create a new site API token on your ` +
    `CitePilot site (Site settings → Integrations → API access) with: ${required}. ` +
    `Paste it into WEBFLOW_API_KEY and restart npm run dev. Existing tokens cannot gain new scopes.`
  );
}
