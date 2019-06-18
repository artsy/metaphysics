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
            appliedFilters: {
              category: "ARCHITECTURE",
              dimension: "SMALL",
            },
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
          partnerStats: {
            uniqueVisitors: 0,
            artworksPublished: {
              timeSeries: [
                {
                  count: 3,
                  time: "2019-03-14T00:00:00Z",
                  samplingFrequency: "DAILY",
                },
                {
                  count: 1,
                  time: "2019-03-18T00:00:00Z",
                  samplingFrequency: "DAILY",
                },
                {
                  count: 1,
                  time: "2019-03-19T00:00:00Z",
                  samplingFrequency: "DAILY",
                },
                {
                  count: 6,
                  time: "2019-03-22T00:00:00Z",
                  samplingFrequency: "DAILY",
                },
                {
                  count: 15,
                  time: "2019-03-28T00:00:00Z",
                  samplingFrequency: "DAILY",
                },
                {
                  count: 2,
                  time: "2019-03-29T00:00:00Z",
                  samplingFrequency: "DAILY",
                },
                {
                  count: 6,
                  time: "2019-04-01T00:00:00Z",
                  samplingFrequency: "DAILY",
                },
                {
                  count: 5,
                  time: "2019-04-04T00:00:00Z",
                  samplingFrequency: "DAILY",
                },
              ],
            },
            topArtworks: {
              edges: [
                {
                  node: {
                    artworkId: "5c12d91fe55c1e2b4010df28",
                    value: 76.0,
                    period: "FOUR_WEEKS",
                  },
                },
                {
                  node: {
                    artworkId: "5bfec60b2bc43f4416ec7509",
                    value: 51.0,
                    period: "FOUR_WEEKS",
                  },
                },
              ],
            },
            sales: {
              partnerId: "5748d153cd530e2d5100031c",
              totalCents: 3682500,
              timeSeries: [
                {
                  startTime: "2019-05-04T00:00:00Z",
                  endTime: "2019-05-05T00:00:00Z",
                  totalCents: 0,
                },
                {
                  startTime: "2019-05-05T00:00:00Z",
                  endTime: "2019-05-06T00:00:00Z",
                  totalCents: 280000,
                },
              ],
            },
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

beforeEach(() => {
  mockFetch.mockClear()
})
