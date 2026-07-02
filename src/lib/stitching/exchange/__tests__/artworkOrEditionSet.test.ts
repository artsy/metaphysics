import gql from "lib/gql"
import { merge } from "lodash"
import { Response } from "node-fetch"
import { runQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

jest.mock("../link")
const mockFetch = require("../link").mockFetch as jest.Mock<any>

describe("artworkOrEditionSet", () => {
  const artwork = {
    price: "$3,000",
    display_price_range: false,
    edition_sets: [
      {
        id: "abc123",
        price: "$5,000",
        display_price_range: false,
      },
    ],
  }

  const artworkLoader = jest.fn().mockResolvedValue(artwork)

  const context: Partial<ResolverContext> = {
    artworkLoader,
  }
  const query = gql`
    query {
      commerceOrder(code: "abc") {
        lineItems {
          edges {
            node {
              artworkOrEditionSet {
                __typename
                ... on Artwork {
                  price
                  displayPriceRange
                }
                ... on EditionSet {
                  price
                  displayPriceRange
                }
              }
            }
          }
        }
      }
    }
  `

  it("returns the price when the line item is not an edition set", async () => {
    const result = await runQuery(query, context)
    expect(
      result.commerceOrder.lineItems.edges[0].node.artworkOrEditionSet.price
    ).toEqual("$3,000")

    expect(
      result.commerceOrder.lineItems.edges[0].node.artworkOrEditionSet
        .displayPriceRange
    ).toEqual(false)
  })

  it("returns the price when the line item is a single edition set", async () => {
    mockFetch.mockImplementationOnce(() => {
      return Promise.resolve(
        new Response(JSON.stringify(editionSetOrderFixture))
      )
    })
    const result = await runQuery(query, context)
    expect(
      result.commerceOrder.lineItems.edges[0].node.artworkOrEditionSet.price
    ).toEqual("$5,000")

    expect(
      result.commerceOrder.lineItems.edges[0].node.artworkOrEditionSet
        .displayPriceRange
    ).toEqual(false)
  })

  it("returns the price when the line item is an edition set of multiple", async () => {
    mockFetch.mockImplementationOnce(() => {
      return Promise.resolve(
        new Response(JSON.stringify(editionSetOrderFixture))
      )
    })

    artworkLoader.mockResolvedValueOnce({
      price: "$3,000 - 10,000",
      edition_sets: [
        {
          id: "abc123",
          price: "$3,000",
          display_price_range: false,
        },
        {
          id: "hello",
          price: "$10,000",
          display_price_range: false,
        },
      ],
    })

    const result = await runQuery(query, context)
    expect(
      result.commerceOrder.lineItems.edges[0].node.artworkOrEditionSet.price
    ).toEqual("$3,000")

    expect(
      result.commerceOrder.lineItems.edges[0].node.artworkOrEditionSet
        .displayPriceRange
    ).toEqual(false)
  })

  it("doesn't fail if the edition set no longer exists", async () => {
    mockFetch.mockImplementationOnce(() => {
      return Promise.resolve(
        new Response(JSON.stringify(editionSetOrderFixture))
      )
    })

    artworkLoader.mockResolvedValueOnce({
      price: "$3,000 - 10,000",
      edition_sets: [
        {
          id: "nomatch1",
          price: "$3,000",
        },
        {
          id: "nomatch2",
          price: "$10,000",
        },
      ],
    })

    const result = await runQuery(query, context)
    expect(
      result.commerceOrder.lineItems.edges[0].node.artworkOrEditionSet
    ).toEqual(null)
  })
})

const orderFixture = {
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
}

const editionSetOrderFixture = merge(orderFixture, {
  data: {
    order: {
      lineItems: {
        edges: [
          {
            node: {
              ...orderFixture.data.order.lineItems.edges[0].node,
              editionSetId: "abc123",
            },
          },
        ],
      },
    },
  },
})
