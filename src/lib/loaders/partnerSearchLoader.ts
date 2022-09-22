import * as url from "url"

export const partnerSearchLoader = (gravityLoader) => {
  return gravityLoader(
    ({ query, ...rest }) => {
      const pathname = "/match/partner/folio-test-partner/shows"
      const queryParams = {
        term: query,
        //"indexes[]": indexes,
        ...rest,
      }

      return url.format({ pathname, query: queryParams })
    },
    {},
    { headers: true }
  )
}
