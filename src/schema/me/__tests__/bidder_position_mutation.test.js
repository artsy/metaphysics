import { runAuthenticatedQuery } from "test/utils"

describe("Bidder position mutation", () => {
  const createBidderPosition = {
      suggested_next_bid_cents: 110000,
  }

  const query = `
  mutation {
    createBidderPosition(input: {
      artwork_id: "daryl-daniels-free-thyself-1"
      max_bid_amount_cents: 100000
      sale_id: "one-year-of-resistance-benefit-auction-2018"
    }) {
      position {
        suggested_next_bid_cents
      }
    }
  }
  `

  const rootValue = {
    createBidderPositionLoader: sinon.stub().returns(
      Promise.resolve(createBidderPosition)
    ),
  }

  it("creates a bidder position", async () => {
    return runAuthenticatedQuery(query, rootValue).then(data => {
      expect(data.createBidderPosition.position.suggested_next_bid_cents).toEqual(110000)
    })
  })
})
