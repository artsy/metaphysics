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
      }
    }
  }
  `

const errorMessageTemplate = `{ Error: https://stagingapi.artsy.net/api/v1/me/bidder_position?
        artwork_id=mohammed-qasim-ashfaq-surrealism&max_bid_amount_cents=3700000&
        sale_id=bidding-test - `

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
      const errorObjectString = `{"type": "param_error", "message":"Please enter a bid higher than $37,000.","detail"\
:{"base":["Please enter a bid higher than $37,000"]}}`
      const errorMessage = {
        message: errorMessageTemplate + errorObjectString,
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
        "Another bidder placed a higher max bid\nor the same max bid before you did."
      )
    })

    it("creates correct message when sale is closed", async () => {
      const errorObjectString = `{"error":"Sale Closed to Bids"}`
      const errorMessage = {
        message: errorMessageTemplate + errorObjectString,
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
        "Sorry, your bid wasn’t received\nbefore the lot closed."
      )
    })
  })

  it("creates correct message when live bidding has started", async () => {
    const errorObjectString = `{"error":"Live Bidding has Started"}`
    const errorMessage = {
      message: errorMessageTemplate + errorObjectString,
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
      "Sorry, your bid wasn’t received before\n" +
        "live bidding started. To continue\n" +
        `bidding, please [join the live auction](${config.PREDICTION_ENDPOINT}/sixteen-year-of-resistance-benefit-auction-2032).`
    )
  })
})

it("creates correct message when bidder is not qualifdied", async () => {
  const errorObjectString = `{"type": "param_error", "message":"Bidder not qualified to bid on this auction."}`
  const errorMessage = {
    message: errorMessageTemplate + errorObjectString,
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
    "Your bid can’t be placed at this time.\n" +
      "Please contact [support@artsy.net](mailto:support@artsy.net) for\n" +
      "more information."
  )
})
