function inlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

/** Lightweight markdown conversion for CMS rich-text HTML fields. */
export function markdownToCmsHtml(markdown: string): string {
  const text = markdown.replace(/<!--[\s\S]*?-->/g, "").trim();
  const lines = text.split("\n");
  const out: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) {
      closeList();
      continue;
    }

    if (/^#\s+/.test(trimmed) && !/^##/.test(trimmed)) {
      closeList();
      out.push(`<h2>${inlineMarkdown(trimmed.replace(/^#\s+/, ""))}</h2>`);
      continue;
    }
    if (/^##\s+/.test(trimmed)) {
      closeList();
      out.push(`<h2>${inlineMarkdown(trimmed.replace(/^##\s+/, ""))}</h2>`);
      continue;
    }
    if (/^###\s+/.test(trimmed)) {
      closeList();
      out.push(`<h3>${inlineMarkdown(trimmed.replace(/^###\s+/, ""))}</h3>`);
      continue;
    }
    if (/^[-*]\s+/.test(trimmed)) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inlineMarkdown(trimmed.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }
    closeList();
    out.push(`<p>${inlineMarkdown(trimmed)}</p>`);
  }

  closeList();
  return out.join("");
}
