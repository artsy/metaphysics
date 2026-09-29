import { CITY_NEIGHBORHOODS } from "./cityNeighborhoods"

export interface CityNeighborhood {
  slug: string
  name: string
}

/**
 * Uppercases, strips whitespace and drops a country prefix such as "F-" or "D-".
 * Returns "" for missing, null or blank input.
 */
export const normalizePostalCode = (postalCode?: string | null): string =>
  (postalCode ?? "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/^[A-Z]{1,2}-(?=\d)/, "")

const UK_DISTRICT_PREFIX = /^[A-Z]{1,2}\d+$/
const UK_FULL_POSTCODE = /^([A-Z]{1,2}\d[A-Z\d]?)\d[A-Z]{2}$/

/**
 * A UK district prefix such as "SW1" matches "SW1A 2AA" but not "SW11 4NP". The check runs on
 * the outward code, because once spaces are gone "N1 5PH" reads as "N15PH".
 */
const matchesPostalPrefix = (code: string, prefix: string): boolean => {
  if (!UK_DISTRICT_PREFIX.test(prefix)) {
    return code.startsWith(prefix)
  }

  const outward = code.match(UK_FULL_POSTCODE)?.[1] ?? code
  return outward.startsWith(prefix) && !/\d/.test(outward.charAt(prefix.length))
}

export const cityNeighborhoodsFor = (citySlug: string): CityNeighborhood[] =>
  (CITY_NEIGHBORHOODS[citySlug] ?? []).map(({ id, title }) => ({
    slug: id,
    name: title,
  }))

/** The longest matching prefix wins; on a tie, the entry listed first. */
export const matchCityNeighborhood = (
  citySlug: string,
  postalCode?: string | null
): CityNeighborhood | null => {
  const code = normalizePostalCode(postalCode)
  if (!code) return null

  let best: { slug: string; name: string; length: number } | null = null

  for (const def of CITY_NEIGHBORHOODS[citySlug] ?? []) {
    const longest = def.postalPrefixes
      .filter((prefix) => matchesPostalPrefix(code, prefix))
      .reduce((max, prefix) => Math.max(max, prefix.length), 0)

    if (longest > 0 && (!best || longest > best.length)) {
      best = { slug: def.id, name: def.title, length: longest }
    }
  }

  return best && { slug: best.slug, name: best.name }
}
