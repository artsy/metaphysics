/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("BidderStatus type", () => {
  it("returns the correct state when you are the high bidder on a work", () => {
    const context = {
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
          bidderStatus(artworkID: "untitled", saleID: "active-auction") {
            isHighestBidder
            mostRecentBid {
              internalID
            }
            activeBid {
              internalID
            }
          }
        }
      }
    `

    return runAuthenticatedQuery(query, context).then(({ me }) => {
      expect(me).toEqual({
        bidderStatus: {
          isHighestBidder: true,
          mostRecentBid: { internalID: "0" },
          activeBid: { internalID: "0" },
        },
      })
    })
  })

  it("returns the correct state when you are outbid on a work", () => {
    const context = {
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
          bidderStatus(artworkID: "untitled", saleID: "active-auction") {
            isHighestBidder
            mostRecentBid {
              internalID
            }
            activeBid {
              internalID
            }
          }
        }
      }
    `

    return runAuthenticatedQuery(query, context).then(({ me }) => {
      expect(me).toEqual({
        bidderStatus: {
          isHighestBidder: false,
          mostRecentBid: { internalID: "0" },
          activeBid: null,
        },
      })
    })
  })
})
