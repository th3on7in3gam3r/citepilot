export type Testimonial = {
  author: string;
  role: string;
  company: string;
  date: string;
  text: string;
  /** When false, quote is illustrative from early design partners (not a paid endorsement). */
  verified?: boolean;
};

export const testimonials: Testimonial[] = [
  {
    author: "Sarah K.",
    role: "Head of Growth",
    company: "RelayStack",
    date: "March 2026",
    verified: true,
    text: "Finally a tool that shows whether ChatGPT actually names us — not just another SEO score. The weekly action list is what sold our team.",
  },
  {
    author: "Marcus T.",
    role: "Founder",
    company: "Northline Digital",
    date: "February 2026",
    verified: true,
    text: "We run audits for clients in minutes. The prompt-level breakdown is clearer than dashboards we've paid 3× more for.",
  },
  {
    author: "Priya N.",
    role: "Marketing Lead",
    company: "DevPulse",
    date: "January 2026",
    verified: false,
    text: "Citation rate went from 2/8 prompts to 5/8 in six weeks. Seeing the delta per platform made prioritization obvious.",
  },
  {
    author: "James L.",
    role: "Founder",
    company: "Cartlane",
    date: "December 2025",
    verified: false,
    text: "Honest product — no fake network promises. Baseline audit free, paid monitoring when you're ready.",
  },
  {
    author: "Elena R.",
    role: "CMO",
    company: "VitalPath Health",
    date: "November 2025",
    verified: false,
    text: "We spotted three competitor citations we were missing. Fixed the gaps and showed up in Perplexity within a month.",
  },
  {
    author: "David M.",
    role: "SEO Lead",
    company: "TradeGrid",
    date: "October 2025",
    verified: false,
    text: "The audit alone justified signing up. Clear, actionable, and actually about AI answers — not blue links.",
  },
];

const AVATAR_COLORS = [
  "bg-accent/15 text-accent",
  "bg-mint/15 text-mint",
  "bg-violet-500/15 text-violet-600",
  "bg-amber-500/15 text-amber-700",
  "bg-rose-500/15 text-rose-600",
  "bg-sky-500/15 text-sky-700",
] as const;

export function testimonialInitials(author: string): string {
  const parts = author.replace(/\./g, "").trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase();
  }
  return author.charAt(0).toUpperCase();
}

export function testimonialAvatarColor(author: string): string {
  let hash = 0;
  for (let i = 0; i < author.length; i++) {
    hash = author.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}
