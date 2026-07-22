import { HelpPageLayout } from "@/components/help/HelpPageLayout";
import {
  contentSectionCard,
  contentSectionTitle,
} from "@/lib/marketing/surface-classes";
import { site } from "@/lib/site";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "CMS Publishing Guide",
  description: `How ${site.name} connects to Webflow, WordPress, Ghost, Hashnode, Shopify, and Framer for article publishing.`,
};

const providerCards = [
  {
    name: "Webflow",
    needs: "Site API token, site ID, and collection ID",
    bestFor: "Teams already publishing the main marketing site from Webflow.",
    note: "Webflow uses shared env vars today rather than per-workspace credentials.",
  },
  {
    name: "WordPress",
    needs: "Site URL, WordPress username, and an Application Password",
    bestFor: "Blogs or marketing sites already running on WordPress.",
    note: "Best first choice if you already have a WordPress blog because setup is straightforward.",
  },
  {
    name: "Ghost",
    needs: "Site URL and a Ghost Admin API key in id:secret format",
    bestFor: "Publisher-style blogs already using Ghost as their CMS.",
    note: "Good fit when the blog is separate from the main app and editorial workflow already lives in Ghost.",
  },
  {
    name: "Hashnode",
    needs: "Personal access token and publication ID",
    bestFor: "Dev-friendly blogs when you have Hashnode Pro for API access.",
    note: "Hashnode retired free API access in 2026 — upgrade to Pro (Dashboard → Billing) to publish from CitePilot. Paste your dashboard URL or publication ID.",
  },
  {
    name: "Shopify",
    needs: "Shop domain and an Admin access token with blog/article write access",
    bestFor: "Commerce brands publishing content inside a Shopify store blog.",
    note: "CitePilot will publish into a Shopify blog so content and store live together.",
  },
  {
    name: "Framer",
    needs: "Project URL, API key, collection ID, and target field IDs",
    bestFor: "Teams using Framer CMS collections for site content.",
    note: "Framer setup is the most technical because you must supply the right collection and field IDs.",
  },
] as const;

const howItWorks = [
  "Generate an article in CitePilot from the Content dashboard.",
  "Connect the CMS for the specific workspace if that workspace already has a site.",
  "Publish the article from the queue to create the first remote item.",
  "Publish the same article again later to update the existing remote item instead of duplicating it.",
] as const;

const quickAnswers = [
  {
    q: "Do I need a CMS to use CitePilot?",
    a: "No. CMS publishing is optional. You can still run audits, track citation history, generate content, and use alerts without connecting anything.",
  },
  {
    q: "Which plan includes CMS publish?",
    a: "Pilot and Fleet include publishing to connected CMS providers. Free tier covers audits and dashboard access — upgrade when you want ongoing monitoring and publish.",
  },
  {
    q: "What if I do not have WordPress, Ghost, Shopify, Framer, or Webflow?",
    a: "Skip CMS setup for now. Keep creating drafts inside CitePilot until you or a client already has a real destination site. WordPress on cheap hosting is the easiest free publish target.",
  },
  {
    q: "When should I connect a CMS?",
    a: "Connect one only when you have an actual site where the generated articles should go live. The CMS panel is there when you need it, not as a launch blocker.",
  },
] as const;

export default function CmsPublishingHelpPage() {
  return (
    <HelpPageLayout
      eyebrow="Help"
      title="CMS publishing guide"
      description={
        <>
          Connect a CMS only if you already have a real website where your
          CitePilot articles should go live. If you do not have one yet, skip
          this step and keep generating content inside the dashboard.
        </>
      }
      actions={[
        { href: "/dashboard/content", label: "Open Content dashboard", primary: true },
        { href: "/dashboard/help", label: "Dashboard help" },
        { href: "/pricing", label: "View plans" },
      ]}
    >
      <section className="content-section-gap grid gap-4 lg:grid-cols-3">
        {quickAnswers.map((item) => (
          <div key={item.q} className={contentSectionCard}>
            <h2 className={`${contentSectionTitle} text-lg`}>{item.q}</h2>
            <p className="content-prose mt-3">{item.a}</p>
          </div>
        ))}
      </section>

      <section className={`content-section-gap ${contentSectionCard}`}>
        <h2 className={contentSectionTitle}>How publishing works</h2>
        <ol className="content-prose mt-5 grid gap-4 md:grid-cols-2">
          {howItWorks.map((step, index) => (
            <li
              key={step}
              className="rounded-2xl border border-border bg-surface/70 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                Step {index + 1}
              </p>
              <p className="mt-2 text-ink">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="content-section-gap">
        <div className="flex flex-col gap-2">
          <h2 className={contentSectionTitle}>Which provider should I use?</h2>
          <p className="content-prose max-w-3xl">
            Use the CMS your real site already runs on. If you do not have any of
            these platforms yet, there is nothing to connect today.
          </p>
        </div>
        <div className="content-prose mt-5 grid gap-4 lg:grid-cols-2">
          {providerCards.map((provider) => (
            <article key={provider.name} className={contentSectionCard}>
              <h3 className="text-xl">{provider.name}</h3>
              <p className="mt-3">
                <span className="font-semibold text-ink">What you need:</span>{" "}
                {provider.needs}
              </p>
              <p className="mt-2">
                <span className="font-semibold text-ink">Best for:</span>{" "}
                {provider.bestFor}
              </p>
              <p className="mt-2">{provider.note}</p>
            </article>
          ))}
        </div>
      </section>
    </HelpPageLayout>
  );
}
