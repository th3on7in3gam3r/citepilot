import {
  testimonialAvatarStyle,
  testimonialInitials,
} from "@/lib/data/testimonials";

export function TestimonialAvatar({
  author,
  size = "md",
  className = "",
}: {
  author: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const initials = testimonialInitials(author);
  const sizeClass =
    size === "sm"
      ? "h-9 w-9 text-xs"
      : "h-11 w-11 text-sm";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-bold text-white ${sizeClass} ${className}`}
      style={testimonialAvatarStyle(author)}
      aria-hidden
    >
      {initials}
    </div>
  );
}
