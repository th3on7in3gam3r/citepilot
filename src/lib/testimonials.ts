export type Testimonial = {
  author: string;
  role: string;
  date: string;
  text: string;
};

export const testimonials: Testimonial[] = [
  {
    author: "Sarah K.",
    role: "Head of Growth · B2B SaaS",
    date: "March 2026",
    text: "Finally a tool that shows whether ChatGPT actually names us — not just another SEO score. The weekly action list is what sold our team.",
  },
  {
    author: "Marcus T.",
    role: "Agency founder",
    date: "February 2026",
    text: "We run audits for clients in minutes. The prompt-level breakdown is clearer than dashboards we've paid 3× more for.",
  },
  {
    author: "Priya N.",
    role: "Marketing lead · DevTools",
    date: "January 2026",
    text: "Citation rate went from 2/8 prompts to 5/8 in six weeks. Seeing the delta per platform made prioritization obvious.",
  },
  {
    author: "James L.",
    role: "Founder · Ecommerce",
    date: "December 2025",
    text: "Honest product — no fake network promises. Baseline audit free, paid monitoring when you're ready.",
  },
  {
    author: "Elena R.",
    role: "CMO · Health tech",
    date: "November 2025",
    text: "We spotted three competitor citations we were missing. Fixed the gaps and showed up in Perplexity within a month.",
  },
  {
    author: "David M.",
    role: "SEO lead · Marketplace",
    date: "October 2025",
    text: "The audit alone justified signing up. Clear, actionable, and actually about AI answers — not blue links.",
  },
];
