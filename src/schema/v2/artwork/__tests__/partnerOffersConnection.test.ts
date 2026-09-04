import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("artwork partnerOffersConnection", () => {
  let partnerOffersLoader
  let context

  beforeEach(() => {
    partnerOffersLoader = jest.fn(() =>
      Promise.resolve({
        body: [
          {
            id: "offer-1",
            active: true,
            artwork_id: "artwork-1",
            available: true,
            partner_id: "partner-1",
            price_currency: "USD",
            discount_percentage: 10,
            source: "Conversation",
            created_at: "2024-02-27T19:01:51.461Z",
            end_at: "2024-03-01T19:01:51.457Z",
          },
        ],
        headers: { "x-total-count": "1" },
      })
    )

    context = {
      artworkLoader: () =>
        Promise.resolve({ id: "artwork-1", _id: "artwork-1" }),
      partnerOffersLoader,
    }
  })

  it("passes user_id and offer_type to the loader and returns the personalized offer", async () => {
    const query = gql`
      {
        artwork(id: "artwork-1") {
          partnerOffersConnection(
            userID: "user-1"
            offerType: [PERSONALIZED]
            first: 10
          ) {
            totalCount
            edges {
              node {
                internalID
                artworkId
                source
              }
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(partnerOffersLoader).toHaveBeenCalledWith(
      expect.objectContaining({
        artwork_id: "artwork-1",
        user_id: "user-1",
        offer_type: ["personalized"],
      })
    )

    expect(data).toEqual({
      artwork: {
        partnerOffersConnection: {
          totalCount: 1,
          edges: [
            {
              node: {
                internalID: "offer-1",
                artworkId: "artwork-1",
                source: "CONVERSATION",
              },
            },
          ],
        },
      },
    })
  })

  it("omits user_id and offer_type when those args are not given", async () => {
    const query = gql`
      {
        artwork(id: "artwork-1") {
          partnerOffersConnection(first: 10) {
            edges {
              node {
                internalID
              }
            }
          }
        }
      }
    `

    await runQuery(query, context)

    expect(partnerOffersLoader).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: undefined, offer_type: undefined })
    )
  })
})
