import { runAuthenticatedQuery } from "test/utils"

describe("BidderPosition", () => {
  it("returns processed_at", () => {
    const rootValue = {
      bidderPositionLoader: () =>
        Promise.resolve({
          body: {
            bidder: {
              sale: {
                _id: "5acd52f3275b2464e5e7f512",
                id: "art-for-life-benefit-auction-2018",
                name: "Art For Life: Benefit Auction 2018",
                is_auction: true,
              },
              user: {
                id: "5647404b258faf41db000161",
                name: "Alexander Graham Bell",
              },
            },
            processed_at: "2018-04-26T14:15:52+00:00",
          },
        }),
    }
    const query = `
      {
        me {
          bidder_position(id: "5ae1df168b3b8141bfc32e5d") {
            processed_at
          }
        }
      }
    `

    return runAuthenticatedQuery(query, rootValue).then(({ me }) => {
      expect(me).toEqual({
        bidder_position: {
          processed_at: "2018-04-26T14:15:52+00:00",
        },
      })
    })
  })
})
