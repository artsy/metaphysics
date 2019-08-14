/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import moment from "moment"

describe("LotStanding type", () => {
  it("returns the correct state when you are the high bidder and reserve is met", () => {
    const lotStandings = [
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
    ]

    const query = `
      {
        me {
          lotStanding(artworkID: "untitled", saleID: "active-auction") {
            isHighestBidder
            mostRecentBid {
              id
            }
            activeBid {
              id
            }
          }
        }
      }
    `

    return runAuthenticatedQuery(query, {
      lotStandingLoader: () => Promise.resolve(lotStandings),
    }).then(({ me }) => {
      expect(me).toEqual({
        lotStanding: {
          isHighestBidder: true,
          mostRecentBid: { id: "0" },
          activeBid: { id: "0" },
        },
      })
    })
  })

  it("returns the correct state when you are outbid on a work & reserve is met", () => {
    const lotStanding = [
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
        leading_position: null,
      },
    ]

    const query = `
      {
        me {
          lotStanding(artworkID: "untitled", saleID: "active-auction") {
            isHighestBidder
            isLeadingBidder
            mostRecentBid {
              id
            }
            activeBid {
              id
            }
          }
        }
      }
    `

    return runAuthenticatedQuery(query, {
      lotStandingLoader: () => Promise.resolve(lotStanding),
    }).then(({ me }) => {
      expect(me).toEqual({
        lotStanding: {
          isHighestBidder: false,
          isLeadingBidder: false,
          mostRecentBid: { id: "0" },
          activeBid: null,
        },
      })
    })
  })

  it("returns the correct state when you are the top bid but reserve is not met", () => {
    const lotStanding = [
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
    ]

    const query = `
      {
        me {
          lotStanding(artworkID: "untitled", saleID: "active-auction") {
            isHighestBidder
            isLeadingBidder
            mostRecentBid {
              id
            }
            activeBid {
              id
            }
          }
        }
      }
    `

    return runAuthenticatedQuery(query, {
      lotStandingLoader: () => Promise.resolve(lotStanding),
    }).then(({ me }) => {
      expect(me).toEqual({
        lotStanding: {
          isHighestBidder: false,
          isLeadingBidder: true,
          mostRecentBid: { id: "0" },
          activeBid: null,
        },
      })
    })
  })

  it("correctly determines if a lot is part of a live and open auction", () => {
    const query = `
      {
        me {
          lotStanding(artworkID: "untitled", saleID: "active-auction") {
            sale {
              isLiveOpen
            }
          }
        }
      }
    `

    const lotStanding = [
      {
        bidder: {
          sale: {
            id: "a-live-auction",
          },
        },
        sale_artwork: {
          id: "untitled",
          reserve_status: "reserve_not_met",
        },
      },
    ]

    const liveOpenSale = {
      auction_state: "open",
      live_start_at: moment().subtract(2, "days"),
      currency: "$",
      is_auction: true,
    }

    return runAuthenticatedQuery(query, {
      lotStandingLoader: () => Promise.resolve(lotStanding),
      saleLoader: () => Promise.resolve(liveOpenSale),
    }).then(({ me }) => {
      expect(me).toEqual({
        lotStanding: {
          sale: { isLiveOpen: true },
        },
      })
    })
  })

  it("correctly determines if a lot is not part of a live and open auction", () => {
    const query = `
      {
        me {
          lotStanding(artworkID: "untitled", saleID: "active-auction") {
            sale {
              isLiveOpen
            }
          }
        }
      }
    `

    const lotStanding = [
      {
        bidder: {
          sale: {
            id: "a-live-auction",
          },
        },
        sale_artwork: {
          id: "untitled",
          reserve_status: "reserve_not_met",
        },
      },
    ]

    const notALiveOpenSale = {
      auction_state: "open",
      live_start_at: moment().add(2, "days"),
      currency: "$",
      is_auction: true,
    }

    return runAuthenticatedQuery(query, {
      lotStandingLoader: () => Promise.resolve(lotStanding),
      saleLoader: () => Promise.resolve(notALiveOpenSale),
    }).then(({ me }) => {
      expect(me).toEqual({
        lotStanding: {
          sale: { isLiveOpen: false },
        },
      })
    })
  })
})
