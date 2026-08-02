export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  light = false,
  className = "",
  headingLevel = "h2",
  id,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  light?: boolean;
  className?: string;
  headingLevel?: "h1" | "h2";
  id?: string;
}) {
  const alignClass = align === "center" ? "mx-auto text-center" : "text-left";
  const Heading = headingLevel;
  const headingId =
    id ??
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const headingClass = `font-display mt-3 text-3xl font-bold tracking-tight md:mt-4 md:text-4xl lg:text-[2.75rem] ${
    light ? "text-white" : "text-foreground"
  }`;

  return (
    <div className={`max-w-2xl ${alignClass} ${className}`}>
      {eyebrow && (
        <p className="marketing-eyebrow">{eyebrow}</p>
      )}
      <Heading id={headingId} className={headingClass}>
        {title}
      </Heading>
      {description && (
        <p
          className={`mt-4 text-base leading-relaxed md:mt-5 md:text-lg ${
            light ? "text-white/70" : "text-muted"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
