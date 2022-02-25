import { runAuthenticatedQuery } from "schema/v2/test/utils"
import config from "config"

const query = `
  mutation {
    createBidderPosition(input: {
      artworkID: "daryl-daniels-free-thyself-1"
      maxBidAmountCents: 100000
      saleID: "sixteen-year-of-resistance-benefit-auction-2032"
    }) {
      result {
        status
        position {
          suggestedNextBid {
            cents
          }
        }
        messageHeader
        messageDescriptionMD
        rawError
      }
    }
  }
  `

describe("Bidder position mutation", () => {
  const createBidderPosition = {
    suggested_next_bid_cents: 110000,
  }

  describe("success", () => {
    it("creates a bidder position", async () => {
      const context = {
        createBidderPositionLoader: sinon
          .stub()
          .returns(Promise.resolve(createBidderPosition)),
      }

      const data = await runAuthenticatedQuery(query, context)
      expect(
        data.createBidderPosition.result.position.suggestedNextBid.cents
      ).toEqual(110000)
      expect(data.createBidderPosition.result.messageHeader).toBeNull()
      expect(data.createBidderPosition.result.messageDescriptionMD).toBeNull()
    })
  })

  describe("error", () => {
    it("creates correct message when bid is not high enough", async () => {
      const errorMessage = {
        body: {
          type: "param_error",
          message: "Please enter a bid higher than $37,000.",
          detail: { base: ["Please enter a bid higher than $37,000"] },
        },
      }
      const context = {
        createBidderPositionLoader: sinon
          .stub()
          .returns(Promise.reject(errorMessage)),
      }

      const data = await runAuthenticatedQuery(query, context)

      expect(data.createBidderPosition.result.position).toBeNull()
      expect(data.createBidderPosition.result.messageHeader).toEqual(
        "Your bid wasn’t high enough"
      )
      expect(data.createBidderPosition.result.messageDescriptionMD).toEqual(
        "Another bidder placed a higher max bid or the same max bid before you did."
      )
      expect(data.createBidderPosition.result.rawError).toEqual(
        "Please enter a bid higher than $37,000."
      )
    })

    it("creates correct message when sale is closed", async () => {
      const errorMessage = {
        body: {
          error: "Sale Closed to Bids",
        },
      }
      const context = {
        createBidderPositionLoader: sinon
          .stub()
          .returns(Promise.reject(errorMessage)),
      }

      const data = await runAuthenticatedQuery(query, context)

      expect(data.createBidderPosition.result.position).toBeNull()
      expect(data.createBidderPosition.result.messageHeader).toEqual(
        "Lot closed"
      )
      expect(data.createBidderPosition.result.messageDescriptionMD).toEqual(
        "Sorry, your bid wasn’t received before the lot closed."
      )
    })
  })

  it("creates correct message when live bidding has started", async () => {
    const errorMessage = {
      body: {
        error: "Live Bidding has Started",
      },
    }
    const context = {
      createBidderPositionLoader: sinon
        .stub()
        .returns(Promise.reject(errorMessage)),
    }

    const data = await runAuthenticatedQuery(query, context)

    expect(data.createBidderPosition.result.position).toBeNull()
    expect(data.createBidderPosition.result.messageHeader).toEqual(
      "Live bidding has started"
    )
    expect(data.createBidderPosition.result.messageDescriptionMD).toEqual(
      `Sorry, your bid wasn’t received before live bidding started. To continue bidding, please [join the live auction](${config.PREDICTION_ENDPOINT}/sixteen-year-of-resistance-benefit-auction-2032).`
    )
  })
})

it("creates correct message when bidder is not qualified", async () => {
  const errorMessage = {
    body: {
      type: "param_error",
      message: "Bidder not qualified to bid on this auction.",
    },
  }
  const context = {
    createBidderPositionLoader: sinon
      .stub()
      .returns(Promise.reject(errorMessage)),
  }

  const data = await runAuthenticatedQuery(query, context)

  expect(data.createBidderPosition.result.position).toBeNull()
  expect(data.createBidderPosition.result.messageHeader).toEqual(
    "Bid not placed"
  )
  expect(data.createBidderPosition.result.messageDescriptionMD).toEqual(
    "Your bid can't be placed at this time. Please contact [support@artsy.net](mailto:support@artsy.net) for more information."
  )
})
