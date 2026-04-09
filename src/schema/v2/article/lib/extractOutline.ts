import { stripTags, unescapeEntities } from "lib/helpers"

interface OutlineEntry {
  id: string
  heading: string
  slug: string
}

const H2_REGEX = /<h2[^>]*>([\s\S]*?)<\/h2>/gi

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

const isTextSection = (
  section: { type: string; body?: string } | null | undefined
): section is { type: "text"; body: string } =>
  section != null && section.type === "text" && typeof section.body === "string"

const extractH2s = (html: string): string[] =>
  Array.from(html.matchAll(H2_REGEX), ([, inner]) => inner)

const parseHeading = (raw: string): string =>
  unescapeEntities(stripTags(raw)).trim()

export const extractOutline = (
  sections:
    | Array<{ type: string; body?: string } | null | undefined>
    | undefined
): OutlineEntry[] => {
  if (!sections) return []

  const headings = sections
    .filter(isTextSection)
    .flatMap((section) => extractH2s(section.body))
    .map(parseHeading)
    .filter(Boolean)

  const slugCounts = new Map<string, number>()

  return headings.map((heading, index) => {
    const baseSlug = slugify(heading) || String(index + 1)
    const count = slugCounts.get(baseSlug) ?? 0
    slugCounts.set(baseSlug, count + 1)
    const slug = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`
    return { id: slug, heading, slug }
  })
}
