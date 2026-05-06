import { createHttpLink } from "apollo-link-http"
import config from "config"
import urljoin from "url-join"
import { middlewareLink } from "../../lib/middlewareLink"
import { Response } from "node-fetch"

const { EXCHANGE_API_BASE } = config
export const mockFetch = jest.fn(() =>
  Promise.resolve(
    new Response(
      JSON.stringify({
        data: {
          order: {
            __typename: "BuyOrder",
            id: "fooid123",
            code: "1",
            state: "PENDING",
            stateReason: null,
            currencyCode: "usd",
            mode: "BUY",
            seller: {
              id: "111",
              __typename: "Partner",
            },
            buyer: {
              id: "111",
              __typename: "User",
            },
            creditCardId: "card123",
            requestedFulfillment: {
              __typename: "Ship",
              name: "Dr Collector",
              addressLine1: "Vanak 123",
              addressLine2: "P 80",
              city: "Tehran",
              region: "Tehran",
              country: "IR",
              postalCode: "09821",
              phoneNumber: "093929821",
            },
            buyerPhoneNumber: "093929821",
            itemsTotalCents: "420000",
            totalListPriceCents: "421000",
            shippingTotalCents: "420100",
            taxTotalCents: "420200",
            commissionFeeCents: "420300",
            transactionFeeCents: "420400",
            buyerTotalCents: "800000",
            sellerTotalCents: "890000",
            updatedAt: "2018-07-03 17:57:47 UTC",
            createdAt: "2018-07-03 17:57:47 UTC",
            stateUpdatedAt: "2018-07-03 17:57:47 UTC",
            stateExpiresAt: "2018-07-03 17:57:47 UTC",
            lastApprovedAt: "2018-04-03 17:57:47 UTC",
            lastSubmittedAt: "2018-03-03 17:57:47 UTC",
            lineItems: {
              edges: [
                {
                  node: {
                    id: "1",
                    priceCents: 420000,
                    listPriceCents: 420000,
                    artworkId: "541324567261693f97790b00",
                    artworkVersionId: "OMGHAHA",
                    artistId: "222",
                    editionSetId: null,
                    quantity: 1,
                    fulfillments: {
                      edges: [
                        {
                          node: {
                            id: "f-1",
                            courier: "fedEx",
                            trackingId: "track1",
                            estimatedDelivery: "2018-05-18",
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      })
    )
  )
)

export const createExchangeLink = () => {
  const httpLink = createHttpLink({
    fetch: mockFetch,
    uri: urljoin(EXCHANGE_API_BASE, "graphql"),
  })
  return middlewareLink.concat(httpLink)
}

beforeEach(() => {
  mockFetch.mockClear()
})
