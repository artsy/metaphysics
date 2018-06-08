/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"
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
          lot_standing(artwork_id: "untitled", sale_id: "active-auction") {
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

    return runAuthenticatedQuery(query, {
      lotStandingLoader: () => Promise.resolve(lotStandings),
    }).then(({ me }) => {
      expect(me).toEqual({
        lot_standing: {
          is_highest_bidder: true,
          most_recent_bid: { id: "0" },
          active_bid: { id: "0" },
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
          lot_standing(artwork_id: "untitled", sale_id: "active-auction") {
            is_highest_bidder
            is_leading_bidder
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

    return runAuthenticatedQuery(query, {
      lotStandingLoader: () => Promise.resolve(lotStanding),
    }).then(({ me }) => {
      expect(me).toEqual({
        lot_standing: {
          is_highest_bidder: false,
          is_leading_bidder: false,
          most_recent_bid: { id: "0" },
          active_bid: null,
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
          lot_standing(artwork_id: "untitled", sale_id: "active-auction") {
            is_highest_bidder
            is_leading_bidder
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

    return runAuthenticatedQuery(query, {
      lotStandingLoader: () => Promise.resolve(lotStanding),
    }).then(({ me }) => {
      expect(me).toEqual({
        lot_standing: {
          is_highest_bidder: false,
          is_leading_bidder: true,
          most_recent_bid: { id: "0" },
          active_bid: null,
        },
      })
    })
  })

  it("correctly determines if a lot is part of a live and open auction", () => {
    const query = `
      {
        me {
          lot_standing(artwork_id: "untitled", sale_id: "active-auction") {
            sale {
              is_live_open
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
        lot_standing: {
          sale: { is_live_open: true },
        },
      })
    })
  })

  it("correctly determines if a lot is not part of a live and open auction", () => {
    const query = `
      {
        me {
          lot_standing(artwork_id: "untitled", sale_id: "active-auction") {
            sale {
              is_live_open
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
        lot_standing: {
          sale: { is_live_open: false },
        },
      })
    })
  })
})
