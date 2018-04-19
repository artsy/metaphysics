import { runAuthenticatedQuery } from "test/utils"

describe("Bidder position mutation", () => {
  const position = {
    bidder: {
      sale: {
        id: "daryl-daniels-free-thyself-1",
      },
    },
  }

  const query = `
  mutation {
    bidderPosition(input: {
      artwork_id: "daryl-daniels-free-thyself-1"
      max_bid_amount_cents: 100000
      sale_id: "one-year-of-resistance-benefit-auction-2018"
    }) {
      sale_id
    }
  }
  `

  const rootValue = {
    meBidderPositionMutationLoader: sinon.stub().returns(
      Promise.resolve(position)
    ),
  }

  it("places a bidder position", async () => {
    return runAuthenticatedQuery(query, rootValue).then(data => {
      expect(data).toEqual({
        bidderPosition: {
          sale_id: "daryl-daniels-free-thyself-1",
        },
      })
    })
  })
})
