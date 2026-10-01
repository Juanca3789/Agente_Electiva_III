export function stripHtml(html: string): string {
  if (!html.includes("<")) return html.trim();
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
}

export function isEmptyHtml(html: string): boolean {
  return stripHtml(html).length === 0;
}
