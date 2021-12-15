/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("BidderPosition", () => {
  const context = {
    meBidderPositionLoader: jest
      .fn()
      .mockReturnValueOnce(
        Promise.resolve({
          body: {
            processed_at: "2018-04-26T14:15:52+00:00",
            active: true,
            sale_artwork: {
              reserve_status: "no_reserve",
            },
          },
        })
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
        })
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
        })
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
        })
      ),
  }
  const query = `
      {
        me {
          bidderPosition(id: "5ae1df168b3b8141bfc32e5d") {
            status
            messageHeader
            messageDescriptionMD
            position {
              processedAt
            }
          }
        }
      }
    `
  it("returns winning when processed and reserve is met and active", () => {
    return runAuthenticatedQuery(query, context).then(({ me }) => {
      expect(me).toEqual({
        bidderPosition: {
          status: "WINNING",
          messageHeader: null,
          messageDescriptionMD: null,
          position: {
            processedAt: "2018-04-26T14:15:52+00:00",
          },
        },
      })
    })
  })
  it("returns pending when not processed yet", () => {
    return runAuthenticatedQuery(query, context).then(({ me }) => {
      expect(me).toEqual({
        bidderPosition: {
          status: "PENDING",
          messageHeader: null,
          messageDescriptionMD: null,
          position: {
            processedAt: null,
          },
        },
      })
    })
  })
  it("returns reserve not met when reserve not met", () => {
    return runAuthenticatedQuery(query, context).then(({ me }) => {
      expect(me).toEqual({
        bidderPosition: {
          status: "RESERVE_NOT_MET",
          messageHeader: "Your bid wasn’t high enough",
          messageDescriptionMD: `Your bid is below the reserve price. Please select a higher bid.`,
          position: {
            processedAt: "2018-04-26T14:15:52+00:00",
          },
        },
      })
    })
  })
  it("returns outbid when not active but reserve is met", () => {
    return runAuthenticatedQuery(query, context).then(({ me }) => {
      expect(me).toEqual({
        bidderPosition: {
          status: "OUTBID",
          messageHeader: "Your bid wasn’t high enough",
          messageDescriptionMD: `Another bidder placed a higher max bid\nor the same max bid before you did.`,
          position: {
            processedAt: "2018-04-26T14:15:52+00:00",
          },
        },
      })
    })
  })
})
