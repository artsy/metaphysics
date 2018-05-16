import { runAuthenticatedQuery } from "test/utils"

describe("BidderPosition", () => {
  const rootValue = {
    meBidderPositionLoader: jest.fn()
      .mockReturnValueOnce(
        Promise.resolve({
          body: {
            processed_at: "2018-04-26T14:15:52+00:00",
            active: true,
            sale_artwork: {
              reserve_status: "no_reserve",
            },
          },
        }),
    )
      .mockReturnValueOnce(
        Promise.resolve({
          body: {
            processed_at: null,
            active: false,
            sale_artwork: {
              reserve_status: "no_reserve",
            },
          },
        }),
    )
      .mockReturnValueOnce(
        Promise.resolve({
          body: {
            processed_at: "2018-04-26T14:15:52+00:00",
            active: false,
            sale_artwork: {
              reserve_status: "reserve_not_met",
            },
          },
        }),
    )
      .mockReturnValueOnce(
        Promise.resolve({
          body: {
            processed_at: "2018-04-26T14:15:52+00:00",
            active: false,
            sale_artwork: {
              reserve_status: "reserve_met",
            },
          },
        }),
    ),
  }
  const query = `
      {
        me {
          bidder_position(id: "5ae1df168b3b8141bfc32e5d") {
            status
            message_header
            position {
              processed_at
            }
          }
        }
      }
    `
  it("returns success when processed and reserve is met and active", () => {
    return runAuthenticatedQuery(query, rootValue).then(({ me }) => {
      expect(me).toEqual({
        bidder_position: {
          status: "SUCCESS",
          message_header: null,
          position: {
            processed_at: "2018-04-26T14:15:52+00:00",
          },
        },
      })
    })
  })
  it("returns pending when not processed yet", () => {
    return runAuthenticatedQuery(query, rootValue).then(({ me }) => {
      expect(me).toEqual({
        bidder_position: {
          status: "PENDING",
          message_header: null,
          position: {
            processed_at: null,
          },
        },
      })
    })
  })
  it("returns reserve not met when reserve not met", () => {
    return runAuthenticatedQuery(query, rootValue).then(({ me }) => {
      expect(me).toEqual({
        bidder_position: {
          status: "ERROR_RESERVE_NOT_MET",
          message_header: "Your bid wasn't high enough",
          position: {
            processed_at: "2018-04-26T14:15:52+00:00",
          },
        },
      })
    })
  })
  it("returns outbid when not active but reserve is met", () => {
    return runAuthenticatedQuery(query, rootValue).then(({ me }) => {
      expect(me).toEqual({
        bidder_position: {
          status: "ERROR_BID_LOW",
          message_header: "Your bid wasn't high enough",
          position: {
            processed_at: "2018-04-26T14:15:52+00:00",
          },
        },
      })
    })
  })
})
