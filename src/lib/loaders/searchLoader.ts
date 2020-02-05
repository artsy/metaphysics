import * as url from "url"
import {
  DEFAULT_ENTITIES,
  SUGGEST_ENTITIES,
} from "schema/v1/search/SearchEntity"
import { without } from "lodash"

const modeMap = {
  AUTOSUGGEST: {
    fallbackEntities: SUGGEST_ENTITIES,
    pathname: "/match/suggest",
  },
  DEFAULT: { fallbackEntities: DEFAULT_ENTITIES, pathname: "/match" },
}

export const searchLoader = gravityLoader => {
  return gravityLoader(
    ({ query, entities, mode, shouldExcludeCollections, ...rest }) => {
      const { fallbackEntities, pathname } = modeMap[mode] || modeMap.DEFAULT
      let indexes = entities || fallbackEntities.map(index => index.value)

      if (shouldExcludeCollections) {
        indexes = without(indexes, "MarketingCollection")
      }

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
