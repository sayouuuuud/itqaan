"use client"

import DOMPurify from "dompurify"
import { useEffect, useState } from "react"

interface SafeHtmlProps {
  html: string | null | undefined
  className?: string
  as?: "div" | "p" | "span"
}

function parseRichTextJSON(content: string): string {
  if (!content) return ""

  // First check if it looks like JSON
  const trimmed = content.trim()
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    // Not JSON, return as plain text or HTML
    return content
  }

  try {
    const parsed = JSON.parse(content)

    // Handle TipTap/ProseMirror format
    if (parsed.type === "doc" && Array.isArray(parsed.content)) {
      return parseNodes(parsed.content)
    }

    // Handle simple object with text fields (sermon intro/main/conclusion format)
    if (typeof parsed === "object" && !Array.isArray(parsed)) {
      const parts: string[] = []

      // Check for common field names
      const textFields = ["introduction", "intro", "main_topic", "main", "body", "content", "conclusion", "text"]

      for (const field of textFields) {
        if (parsed[field] && typeof parsed[field] === "string") {
          parts.push(`<div class="mb-4">${parsed[field]}</div>`)
        }
      }

      if (parts.length > 0) return parts.join("")

      // If no known fields, try to stringify nicely
      return `<pre class="whitespace-pre-wrap">${JSON.stringify(parsed, null, 2)}</pre>`
    }

    // If array of strings/objects
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          if (typeof item === "string") return `<p>${item}</p>`
          if (typeof item === "object") return parseRichTextJSON(JSON.stringify(item))
          return String(item)
        })
        .join("")
    }

    return content
  } catch {
    // Not valid JSON, return as-is (it's probably HTML or plain text)
    return content
  }
}

function parseNodes(nodes: any[]): string {
  if (!Array.isArray(nodes)) return ""
  return nodes.map(parseNode).join("")
}

function parseNode(node: any): string {
  if (!node) return ""

  switch (node.type) {
    case "paragraph":
      const pContent = node.content ? parseNodes(node.content) : ""
      let pClass = "mb-4 leading-relaxed"
      if (node.attrs?.textAlign) {
        pClass += ` text-${node.attrs.textAlign}`
      }
      return `<p class="${pClass}">${pContent || "&nbsp;"}</p>`

    case "heading":
      const level = node.attrs?.level || 2
      const hContent = node.content ? parseNodes(node.content) : ""
      let hClass = "font-bold mb-3 mt-6"
      if (level === 2) hClass += " text-2xl"
      else if (level === 3) hClass += " text-xl"
      else if (level === 4) hClass += " text-lg"
      if (node.attrs?.textAlign) {
        hClass += ` text-${node.attrs.textAlign}`
      }
      return `<h${level}
class = "${hClass}">${hContent}</h${level}>`

    case "text":
      let text = node.text || ""
      let styles = ""
      if (node.marks) {
        for (const mark of node.marks) {
          switch (mark.type) {
            case "bold":
            case "strong":
              text = `<strong>${text}</strong>`
              break
            case "italic":
            case "em":
              text = `<em>${text}</em>`
              break
            case "underline":
              text = `<u>${text}</u>`
              break
            case "strike":
              text = `<s>${text}</s>`
              break
            case "link":
              text = `<a href="${mark.attrs?.href || "#"}" class="text-primary hover:underline" target="_blank" rel="noopener">${text}</a>`
              break
            case "code":
              text = `<code class="bg-muted px-1 rounded font-mono text-sm">${text}</code>`
              break
            case "textStyle":
              if (mark.attrs?.color) {
                styles += `color: ${mark.attrs.color}; `
              }
              break
          }
        }
      }
      if (styles) {
        text = `<span style="${styles.trim()}">${text}</span>`
      }
      return text

    case "bulletList":
      const ulContent = node.content ? parseNodes(node.content) : ""
      return `<ul class="list-disc list-inside mb-4 space-y-1">${ulContent}</ul>`

    case "orderedList":
      const olContent = node.content ? parseNodes(node.content) : ""
      return `<ol class="list-decimal list-inside mb-4 space-y-1">${olContent}</ol>`

    case "listItem":
      const liContent = node.content ? parseNodes(node.content) : ""
      // Remove paragraph wrapper from list items
      return `<li>${liContent.replace(/<\/?p[^>]*>/g, "")}</li>`

    case "blockquote":
      const bqContent = node.content ? parseNodes(node.content) : ""
      return `<blockquote class="border-r-4 border-primary pr-4 italic my-4 text-text-muted">${bqContent}</blockquote>`

    case "codeBlock":
      const codeContent = node.content ? parseNodes(node.content) : ""
      return `<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4">
<code>${codeContent}</code>
</pre>`

    case "horizontalRule":
      return `<hr class="my-6 border-border" />`

    case "hardBreak":
      return "<br />"

    case "image":
      const src = node.attrs?.src || ""
      const alt = node.attrs?.alt || ""
      return `<img src="${src}" alt="${alt}" class="max-w-full h-auto rounded-lg my-4" />`

    default:
      if (node.content) {
        return parseNodes(node.content)
      }
      return node.text || ""
  }
}

export function SafeHtml({ html, className="", as: Tag = "div" }: SafeHtmlProps) {
  const [sanitizedHtml, setSanitizedHtml] = useState<string>("")

  useEffect(() => {
    if (!html) {
      setSanitizedHtml("")
      return
    }

    // First, try to parse as JSON Rich Text
    const parsedHtml = parseRichTextJSON(html)

    // Add some basic CSS for better rendering
    const styledHtml = `
      <style>
        .prose-content {
          line-height: 1.7;
          color: inherit;
        }
        .prose-content h2, .prose-content h3, .prose-content h4 {
          color: inherit;
          margin-top: 2rem;
          margin-bottom: 1rem;
          font-weight: bold;
        }
        .prose-content p {
          margin-bottom: 1rem;
          line-height: 1.7;
        }
        .prose-content ul, .prose-content ol {
          margin-bottom: 1rem;
          padding-right: 1.5rem;
        }
        .prose-content li {
          margin-bottom: 0.5rem;
        }
        .prose-content blockquote {
          border-right: 4px solid hsl(var(--primary));
          padding-right: 1rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: hsl(var(--muted-foreground));
        }
        .prose-content code {
          background: hsl(var(--muted));
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.875em;
        }
        .prose-content pre {
          background: hsl(var(--muted));
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        .prose-content pre code {
          background: none;
          padding: 0;
        }
        .prose-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1.5rem 0;
        }
        .prose-content hr {
          border: none;
          border-top: 1px solid hsl(var(--border));
          margin: 2rem 0;
        }
        .prose-content a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
        .prose-content a:hover {
          color: hsl(var(--primary));
          opacity: 0.8;
        }

        /* Print styles */
        @media print {
          .prose-content {
            color: black !important;
            line-height: 1.6 !important;
          }
          .prose-content h2, .prose-content h3, .prose-content h4 {
            color: black !important;
            page-break-after: avoid;
          }
          .prose-content p {
            orphans: 3;
            widows: 3;
          }
          .prose-content blockquote {
            border-color: #666 !important;
            color: #333 !important;
          }
          .prose-content code {
            background: #f5f5f5 !important;
            color: #333 !important;
          }
        }
      </style>
<div class="prose-content">
        ${parsedHtml}
      </div>
    `

    // Then sanitize the HTML
    if (typeof window !== "undefined") {
      try {
        const cleanHtml = DOMPurify.sanitize(styledHtml, {
          ADD_TAGS: ["iframe", "style"],
          ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "target"],
          ALLOWED_TAGS: [
            "style",
            "iframe",
            "span",
            "strong",
            "em",
            "u",
            "s",
            "code",
            "pre",
            "blockquote",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "p",
            "br",
            "hr",
            "ul",
            "ol",
            "li",
            "a",
            "img",
            "div",
            "section",
            "article",
            "header",
            "footer",
            "main",
            "aside",
            "nav",
            "figure",
            "figcaption",
            "table",
            "thead",
            "tbody",
            "tr",
            "th",
            "td"
          ],
          ALLOWED_ATTR: [
            "style",
            "href",
            "target",
            "rel",
            "src",
            "alt",
            "allow",
            "allowfullscreen",
            "frameborder",
            "scrolling",
            "class",
            "id",
            "title",
            "dir",
            "lang"
          ]
        })
        setSanitizedHtml(cleanHtml)
      } catch (error) {
        console.warn('DOMPurify failed, using basic HTML:', error)
        setSanitizedHtml(styledHtml)
      }
    } else {
      // Server-side: basic HTML sanitization
      const basicSanitized = styledHtml
        .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
        .replace(/<style[^>]*>.*?<\/style>/gi, '') // Remove styles temporarily
        .replace(/javascript:/gi, '') // Remove javascript: URLs
        .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
      setSanitizedHtml(basicSanitized)
    }
  }, [html])

  if (!sanitizedHtml) return null

  return <Tag className={`prose prose-lg max-w-none ${className}`}
dangerouslySetInnerHTML = {{ __html: sanitizedHtml }} />
}
