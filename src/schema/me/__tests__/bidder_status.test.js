/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"

describe("BidderStatus type", () => {
  it("returns the correct state when you are the high bidder on a work", () => {
    const rootValue = {
      lotStandingLoader: sinon.stub().returns(
        Promise.resolve([
          {
            sale_artwork: {
              id: "untitled",
              reserve_status: "reserve_met",
            },
            max_position: {
              id: 0,
              max_bid_amount_cents: 90000,
              sale_artwork_id: "untitled",
            },
            leading_position: {
              id: 0,
              max_bid_amount_cents: 90000,
              sale_artwork_id: "untitled",
            },
          },
          {
            sale_artwork: {
              id: "untitled-2",
              reserve_status: "reserve_met",
            },
            max_position: {
              id: 1,
              max_bid_amount_cents: 100000,
              sale_artwork_id: "untitled-2",
            },
            leading_position: {
              id: 2,
              max_bid_amount_cents: 100000,
              sale_artwork_id: "untitled-2",
            },
          },
        ])
      ),
    }
    const query = `
      {
        me {
          bidder_status(artwork_id: "untitled", sale_id: "active-auction") {
            is_highest_bidder
            most_recent_bid {
              id
            }
            active_bid {
              id
            }
          }
        }
      }
    `

    return runAuthenticatedQuery(query, rootValue).then(({ me }) => {
      expect(me).toEqual({
        bidder_status: {
          is_highest_bidder: true,
          most_recent_bid: { id: "0" },
          active_bid: { id: "0" },
        },
      })
    })
  })

  it("returns the correct state when you are outbid on a work", () => {
    const rootValue = {
      lotStandingLoader: sinon.stub().returns(
        Promise.resolve([
          {
            sale_artwork: {
              id: "untitled",
              reserve_status: "reserve_not_met",
            },
            max_position: {
              id: 0,
              max_bid_amount_cents: 90000,
              sale_artwork_id: "untitled",
            },
            leading_position: {
              id: 0,
              max_bid_amount_cents: 90000,
              sale_artwork_id: "untitled",
            },
          },
        ])
      ),
    }

    const query = `
      {
        me {
          bidder_status(artwork_id: "untitled", sale_id: "active-auction") {
            is_highest_bidder
            most_recent_bid {
              id
            }
            active_bid {
              id
            }
          }
        }
      }
    `

    return runAuthenticatedQuery(query, rootValue).then(({ me }) => {
      expect(me).toEqual({
        bidder_status: {
          is_highest_bidder: false,
          most_recent_bid: { id: "0" },
          active_bid: null,
        },
      })
    })
  })
})
