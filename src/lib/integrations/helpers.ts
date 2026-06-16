export function maskSecret(value: string, visible = 4): string {
  const trimmed = value.trim();
  if (!trimmed) return "—";
  if (trimmed.length <= visible) return "••••";
  return `••••${trimmed.slice(-visible)}`;
}

export function framerWidgetScriptTag(workspaceId: string, baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, "");
  return `<script src="${base}/widget.js" data-workspace="${workspaceId}" defer></script>`;
}
