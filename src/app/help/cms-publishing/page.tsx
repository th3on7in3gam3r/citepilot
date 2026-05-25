import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";
import { site } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CMS Publishing Guide",
  description: `How ${site.name} connects to Webflow, WordPress, Ghost, Shopify, and Framer for article publishing.`,
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
    a: "No. CMS publishing is optional. You can still run audits, generate content, manage workspaces, and use the rest of CitePilot without connecting anything.",
  },
  {
    q: "What if I do not have WordPress, Ghost, Shopify, Framer, or Webflow?",
    a: "Skip CMS setup for now. Keep creating drafts inside CitePilot until you or a client already has a real destination site.",
  },
  {
    q: "When should I connect a CMS?",
    a: "Connect one only when you have an actual site where the generated articles should go live. The CMS panel is there when you need it, not as a launch blocker.",
  },
] as const;

export default function CmsPublishingHelpPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream pt-24">
        <Container className="pb-16">
          <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm md:p-12">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Help
            </p>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink md:text-5xl">
              CMS publishing guide
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted md:text-lg">
              Connect a CMS only if you already have a real website where your
              CitePilot articles should go live. If you do not have one yet, skip
              this step and keep generating content inside the dashboard.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard/content"
                className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
              >
                Open Content dashboard
              </Link>
              <Link
                href="/pricing"
                className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-ink transition hover:bg-surface"
              >
                View plans
              </Link>
            </div>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-3">
            {quickAnswers.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-border bg-white p-6 shadow-sm"
              >
                <h2 className="font-display text-lg font-bold text-ink">{item.q}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{item.a}</p>
              </div>
            ))}
          </section>

          <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
            <h2 className="font-display text-2xl font-bold text-ink">
              How publishing works
            </h2>
            <ol className="mt-5 grid gap-4 md:grid-cols-2">
              {howItWorks.map((step, index) => (
                <li
                  key={step}
                  className="rounded-2xl border border-border bg-surface/70 p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                    Step {index + 1}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink">{step}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-6">
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-2xl font-bold text-ink">
                Which provider should I use?
              </h2>
              <p className="max-w-3xl text-sm leading-relaxed text-muted">
                Use the CMS your real site already runs on. If you do not have any of
                these platforms yet, there is nothing to connect today.
              </p>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {providerCards.map((provider) => (
                <article
                  key={provider.name}
                  className="rounded-2xl border border-border bg-white p-6 shadow-sm"
                >
                  <h3 className="font-display text-xl font-bold text-ink">
                    {provider.name}
                  </h3>
                  <p className="mt-3 text-sm text-muted">
                    <span className="font-semibold text-ink">What you need:</span>{" "}
                    {provider.needs}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    <span className="font-semibold text-ink">Best for:</span>{" "}
                    {provider.bestFor}
                  </p>
                  <p className="mt-2 text-sm text-muted">{provider.note}</p>
                </article>
              ))}
            </div>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
