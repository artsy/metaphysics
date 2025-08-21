import * as url from "url"
import {
  DEFAULT_ENTITIES,
  SUGGEST_ENTITIES,
} from "schema/v2/search/SearchEntity"

const modeMap = {
  AUTOSUGGEST: {
    fallbackEntities: SUGGEST_ENTITIES,
    pathname: "/match/suggest",
  },
  INTERNAL_AUTOSUGGEST: {
    fallbackEntities: SUGGEST_ENTITIES,
    pathname: "/match/suggest/internal",
  },
  DEFAULT: { fallbackEntities: DEFAULT_ENTITIES, pathname: "/match" },
}

export const searchLoader = (gravityLoader) => {
  return gravityLoader(
    ({ query, entities, mode, ...rest }) => {
      const { fallbackEntities, pathname } = modeMap[mode] || modeMap.DEFAULT
      const indexes = entities || fallbackEntities.map((index) => index.value)

      const queryParams = {
        term: query,
        "indexes[]": indexes,
        ...rest,
      }

      return url.format({ pathname, query: queryParams })
    },
    {},
    { headers: true }
  )
}
