/** ISR revalidate intervals (seconds) for public marketing pages. */
export const ISR = {
  homepage: 3600,
  pricing: 3600,
  blogIndex: 1800,
  blogPost: 86400,
  launch: 60,
  press: 86400,
  agency: 86400,
  marketing: 3600,
  static: 86400,
} as const;
