import { createHttpLink } from "apollo-link-http"
import config from "config"
import urljoin from "url-join"
import { middlewareLink } from "../../lib/middlewareLink"
import { Response } from "node-fetch"

const { VORTEX_API_BASE } = config
export const mockFetch = jest.fn(() =>
  Promise.resolve(
    new Response(
      JSON.stringify({
        data: {
          pricingContext: {
            filterDescription: `Small mocks by David Sheldrick`,
            bins: [
              {
                maxPriceCents: 8855,
                minPriceCents: 900,
                numArtworks: 67,
              },
              {
                maxPriceCents: 16810,
                minPriceCents: 8855,
                numArtworks: 57,
              },
              {
                maxPriceCents: 24765,
                minPriceCents: 16810,
                numArtworks: 45,
              },
              {
                maxPriceCents: 32720,
                minPriceCents: 24765,
                numArtworks: 17,
              },
            ],
          },
        },
      })
    )
  )
)

export const createVortexLink = () => {
  const httpLink = createHttpLink({
    fetch: mockFetch,
    uri: urljoin(VORTEX_API_BASE, "graphql"),
  })
  return middlewareLink.concat(httpLink)
}
