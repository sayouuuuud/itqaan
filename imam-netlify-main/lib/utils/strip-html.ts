export function stripHtml(html: string | null | undefined): string {
  if (!html) {
    return ""
  }
  return html.replace(/<[^>]*>/g, "").trim()
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength) + "..."
}

export function formatContent(html: string | null | undefined, maxLength?: number): string {
  const stripped = stripHtml(html)
  if (maxLength) {
    return truncateText(stripped, maxLength)
  }
  return stripped
}
