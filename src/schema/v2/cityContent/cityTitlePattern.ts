import type { TCity } from "schema/v2/city"

// Other spellings of a city that editors use in titles.
const CITY_ALIASES: Record<string, string[]> = {
  "new-york-ny-usa": ["NYC"],
  "los-angeles-ca-usa": ["L.A."],
}

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

// Positron builds a case-insensitive RegExp from `q` and matches it against the thumbnail title.
export const cityTitlePattern = (city: TCity) =>
  `\\b(?:${[city.name, ...(CITY_ALIASES[city.slug] ?? [])]
    .map(escapeRegExp)
    .join("|")})`
