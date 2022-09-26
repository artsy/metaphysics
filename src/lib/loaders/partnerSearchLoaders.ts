import * as url from "url"

const partnerSearchLoader = (pathname: string) => {
  return (gravityLoader) => {
    return gravityLoader(
      ({ query, ...rest }) => {
        const queryParams = {
          term: query,
          ...rest,
        }

        return url.format({ pathname, query: queryParams })
      },
      {},
      { headers: true }
    )
  }
}

//TODO: pass the real partner path
export const partnerSearchShowsLoader = partnerSearchLoader(
  "/match/partner/folio-test-partner/shows"
)
export const partnerSearchArtistsLoader = partnerSearchLoader(
  "/match/partner/folio-test-partner/artists"
)
export const partnerSearchArtworksLoader = partnerSearchLoader(
  "/match/partner/folio-test-partner/artworks"
)
