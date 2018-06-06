/* eslint-disable promise/always-return */
import { runAuthenticatedQuery, runQuery } from "test/utils"

describe("Bidder mutation", () => {
  const bidder = {
    sale: {
      _id: "sale123",
      id: "shared-live-mocktion",
      name: "Shared Live Mocktion",
      is_auction: true,
      auction_state: "open",
      published: true,
      original_width: null,
      original_height: null,
      image_url: null,
      image_versions: [],
      image_urls: {},
      created_at: "2018-05-28T02:50:09+00:00",
      currency: "CHF",
      symbol: "CHF",
      registration_ends_at: null,
      require_bidder_approval: false,
      increment_strategy: "default",
    },
    user: { id: "user123", _id: "user123", name: "Lucille Bluth" },
    id: "bidder123",
    created_by_admin: false,
    created_at: "2018-05-29T15:43:22+00:00",
    pin: "1234",
    qualified_for_bidding: true,
  }

  const mutation = `
  mutation {
    createBidder(input: {sale_id: "sale123"}) {
      bidder {
        qualified_for_bidding
        sale {
          id
          auction_state
        }
      }
    }
  }
  `

  const rootValue = {
    createBidderLoader: () => Promise.resolve(bidder),
  }

  it("creates a bidder", async () => {
    return runAuthenticatedQuery(mutation, rootValue).then(data => {
      expect(data).toEqual({
        createBidder: {
          bidder: {
            qualified_for_bidding: true,
            sale: {
              id: "shared-live-mocktion",
              auction_state: "open",
            },
          },
        },
      })
    })
  })

  it("requires an access token", () => {
    return runQuery(mutation, rootValue).catch(error => {
      expect(error.message).toEqual(
        "You need to be signed in to perform this action"
      )
    })
  })
})
