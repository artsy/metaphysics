import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

const query = gql`
  query {
    me {
      resaleSubmission(id: "submission-1") {
        internalID
        state
        channel
        submittedArtworkID
        priceListed {
          minor
          currencyCode
          display
        }
        recommendedPriceMin {
          minor
          currencyCode
        }
        recommendedPriceMax {
          minor
          currencyCode
        }
        canceledAt
        createdAt(format: "YYYY-MM-DD")
        updatedAt(format: "YYYY-MM-DD")
      }
    }
  }
`

const acceptedSubmission = {
  id: "submission-1",
  user_id: "user-42",
  submitted_artwork_id: "artwork-1",
  state: "accepted",
  channel: "marketplace",
  price_currency_code: "USD",
  price_listed_minor: 250000,
  recommended_price_min_minor: 200000,
  recommended_price_max_minor: 300000,
  canceled_at: null,
  created_at: "2026-11-12T10:00:00.000Z",
  updated_at: "2026-11-12T11:00:00.000Z",
}

let context: Partial<ResolverContext>

beforeEach(() => {
  context = {
    meLoader: jest.fn(() => Promise.resolve({ id: "user-42" })),
    meResaleSubmissionLoader: jest.fn(() =>
      Promise.resolve(acceptedSubmission)
    ),
  }
})

describe("me.resaleSubmission", () => {
  it("passes the id to Gravity", async () => {
    await runAuthenticatedQuery(query, context)

    expect(context.meResaleSubmissionLoader as jest.Mock).toHaveBeenCalledWith(
      "submission-1"
    )
  })

  it("returns an accepted submission", async () => {
    const response = await runAuthenticatedQuery(query, context)

    expect(response.me.resaleSubmission).toEqual({
      internalID: "submission-1",
      state: "ACCEPTED",
      channel: "MARKETPLACE",
      submittedArtworkID: "artwork-1",
      priceListed: {
        minor: 250000,
        currencyCode: "USD",
        display: "US$2,500",
      },
      recommendedPriceMin: { minor: 200000, currencyCode: "USD" },
      recommendedPriceMax: { minor: 300000, currencyCode: "USD" },
      canceledAt: null,
      createdAt: "2026-11-12",
      updatedAt: "2026-11-12",
    })
  })

  it("returns null money fields when prices are unset", async () => {
    context.meResaleSubmissionLoader = jest.fn(() =>
      Promise.resolve({
        ...acceptedSubmission,
        price_listed_minor: null,
        recommended_price_min_minor: null,
        recommended_price_max_minor: null,
      })
    )

    const response = await runAuthenticatedQuery(query, context)

    expect(response.me.resaleSubmission.priceListed).toBeNull()
    expect(response.me.resaleSubmission.recommendedPriceMin).toBeNull()
    expect(response.me.resaleSubmission.recommendedPriceMax).toBeNull()
  })

  it("returns a rejected submission with no channel", async () => {
    context.meResaleSubmissionLoader = jest.fn(() =>
      Promise.resolve({
        ...acceptedSubmission,
        state: "rejected",
        channel: null,
      })
    )

    const response = await runAuthenticatedQuery(query, context)

    expect(response.me.resaleSubmission.state).toEqual("REJECTED")
    expect(response.me.resaleSubmission.channel).toBeNull()
  })

  it("propagates a Gravity 404", async () => {
    context.meResaleSubmissionLoader = jest.fn(() =>
      Promise.reject(new HTTPError("Not Found", 404, { error: "Not Found" }))
    )

    await expect(runAuthenticatedQuery(query, context)).rejects.toThrow()
  })

  it("returns null when signed out", async () => {
    const response = await runQuery(query, {})

    expect(response.me).toBeNull()
  })
})
