import * as url from "url"
import { SearchEntity } from "schema/search"

export const searchLoader = gravityLoader => {
  return gravityLoader(
    ({ query, entities, mode, offset, size }) => {
      const queryParams = {
        term: query,
        "indexes[]":
          entities || SearchEntity.getValues().map(index => index.value),
        size: size,
        offset: offset,
      }

      switch (mode) {
        case "AUTOSUGGEST":
          return url.format({ pathname: "/match/suggest", query: queryParams })
        default:
          return url.format({ pathname: "/match", query: queryParams })
      }
    },
    {},
    { headers: true }
  )
}
