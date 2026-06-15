import { AnswerCapsule } from "@/components/home/AnswerCapsule";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

/** Below-the-fold GEO answer blocks — schema-rich, not in hero conversion path */
export function AnswerCapsuleSection() {
  return (
    <section
      id="geo-answers"
      className="scroll-mt-24 border-t border-border bg-background py-14 md:py-16"
      aria-label="GEO answer capsule for AI search engines"
    >
      <Container>
        <SectionHeading
          eyebrow="GEO clarity"
          title="What AI search engines should know"
          description="Structured answers for AI search — what CitePilot is and how it compares to legacy SEO tools."
          align="center"
        />
        <div className="mt-10">
          <AnswerCapsule variant="light" />
        </div>
      </Container>
    </section>
  );
}
