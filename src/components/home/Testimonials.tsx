import { Section } from "@/components/ui/Section";
import { TestimonialAvatar } from "@/components/ui/TestimonialAvatar";
import { testimonials } from "@/lib/data/testimonials";

function TestimonialCard({
  review,
}: {
  review: (typeof testimonials)[number];
}) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-white p-7 dark:border-[#222] dark:bg-card md:p-8">
      <div className="flex gap-1 text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className="mt-6 flex-1 text-base leading-relaxed text-ink/90">
        &ldquo;{review.text}&rdquo;
      </p>
      <footer className="mt-8 flex items-center gap-4 border-t border-border pt-6">
        <TestimonialAvatar author={review.author} />
        <div className="min-w-0">
          <p className="font-semibold text-ink">{review.author}</p>
          <p className="text-sm font-medium text-accent">{review.company}</p>
          <p className="text-sm text-muted">
            {review.role}
            {review.verified === false ? " · Illustrative" : ""}
          </p>
        </div>
      </footer>
    </article>
  );
}

export function Testimonials() {
  return (
    <Section className="bg-cream dark:bg-background">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl lg:text-[2.75rem]">
          From CitePilot customers
        </h2>
      </div>

      <div className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-6 md:mt-16 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((review) => (
          <TestimonialCard key={review.author} review={review} />
        ))}
      </div>
    </Section>
  );
}
