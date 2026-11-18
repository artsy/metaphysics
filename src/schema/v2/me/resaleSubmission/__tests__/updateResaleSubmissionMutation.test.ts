import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

const mutationWith = (input: string) => gql`
  mutation {
    updateResaleSubmission(input: { id: "submission-1", ${input} }) {
      resaleSubmissionOrError {
        __typename
        ... on UpdateResaleSubmissionSuccess {
          resaleSubmission {
            internalID
            priceListed {
              minor
              currencyCode
            }
            packaging
            packer
            courierHandoff
            conditionPhotos {
              internalID
            }
          }
        }
        ... on UpdateResaleSubmissionFailure {
          mutationError {
            type
            message
            statusCode
            fieldErrors {
              name
              message
            }
          }
        }
      }
    }
  }
`

const updatedSubmission = {
  id: "submission-1",
  user_id: "user-42",
  submitted_artwork_id: "artwork-1",
  state: "accepted",
  channel: "marketplace",
  rejection_reasons: [],
  price_currency_code: "USD",
  price_listed_minor: 250050,
  packaging: "framed",
  packer: "courier",
  courier_handoff: "seller_dropoff",
  missing_requirements: [],
}

let context: Partial<ResolverContext>

beforeEach(() => {
  context = {
    meUpdateResaleSubmissionLoader: jest.fn(() =>
      Promise.resolve(updatedSubmission)
    ),
  }
})

describe("updateResaleSubmission", () => {
  it("sends the price in minor units and the shipping answers to Gravity", async () => {
    await runAuthenticatedQuery(
      mutationWith(
        `priceListed: "2500.50", packaging: FRAMED, packer: COURIER, courierHandoff: SELLER_DROPOFF`
      ),
      context
    )

    expect(
      context.meUpdateResaleSubmissionLoader as jest.Mock
    ).toHaveBeenCalledWith("submission-1", {
      price_listed_minor: 250050,
      packaging: "framed",
      packer: "courier",
      courier_handoff: "seller_dropoff",
    })
  })

  it("only sends the fields that were given", async () => {
    await runAuthenticatedQuery(mutationWith(`packer: SELLER`), context)

    expect(
      context.meUpdateResaleSubmissionLoader as jest.Mock
    ).toHaveBeenCalledWith("submission-1", { packer: "seller" })
  })

  it("does not send fields that are explicitly null", async () => {
    await runAuthenticatedQuery(
      mutationWith(`priceListed: null, packaging: null, packer: SELLER`),
      context
    )

    expect(
      context.meUpdateResaleSubmissionLoader as jest.Mock
    ).toHaveBeenCalledWith("submission-1", { packer: "seller" })
  })

  it("returns the updated submission", async () => {
    const response = await runAuthenticatedQuery(
      mutationWith(`priceListed: "2500.50"`),
      context
    )

    expect(response.updateResaleSubmission.resaleSubmissionOrError).toEqual({
      __typename: "UpdateResaleSubmissionSuccess",
      resaleSubmission: {
        internalID: "submission-1",
        priceListed: { minor: 250050, currencyCode: "USD" },
        packaging: "FRAMED",
        packer: "COURIER",
        courierHandoff: "SELLER_DROPOFF",
        conditionPhotos: [],
      },
    })
  })

  describe("price validation", () => {
    it.each([
      ["a currency symbol", "$2500", /plain number/],
      ["a thousands separator", "2,500", /plain number/],
      ["a negative price", "-5", /plain number/],
      ["text", "free", /plain number/],
      ["too many decimals", "2500.505", /at most 2 decimal places for USD/],
    ])("rejects %s without calling Gravity", async (_label, price, message) => {
      await expect(
        runAuthenticatedQuery(mutationWith(`priceListed: "${price}"`), context)
      ).rejects.toThrow(message)

      expect(
        context.meUpdateResaleSubmissionLoader as jest.Mock
      ).not.toHaveBeenCalled()
    })
  })

  describe("when Gravity rejects the update", () => {
    it("returns field errors from a 400 param_error", async () => {
      context.meUpdateResaleSubmissionLoader = jest.fn(() =>
        Promise.reject(
          new HTTPError("Bad Request", 400, {
            type: "param_error",
            message: "Invalid parameters",
            detail: { price_listed_minor: ["must be greater than 0"] },
          })
        )
      )

      const response = await runAuthenticatedQuery(
        mutationWith(`priceListed: "0"`),
        context
      )

      expect(response.updateResaleSubmission.resaleSubmissionOrError).toEqual({
        __typename: "UpdateResaleSubmissionFailure",
        mutationError: {
          type: "param_error",
          message: "Invalid parameters",
          statusCode: 400,
          fieldErrors: [
            { name: "price_listed_minor", message: "must be greater than 0" },
          ],
        },
      })
    })

    it("returns a failure for a 404", async () => {
      context.meUpdateResaleSubmissionLoader = jest.fn(() =>
        Promise.reject(new HTTPError("Not Found", 404, { error: "Not Found" }))
      )

      const response = await runAuthenticatedQuery(
        mutationWith(`packer: SELLER`),
        context
      )

      expect(response.updateResaleSubmission.resaleSubmissionOrError).toEqual({
        __typename: "UpdateResaleSubmissionFailure",
        mutationError: {
          type: "error",
          message: "Not Found",
          statusCode: 404,
          fieldErrors: null,
        },
      })
    })

    it("rethrows errors that did not come from Gravity", async () => {
      context.meUpdateResaleSubmissionLoader = jest.fn(() =>
        Promise.reject(new Error("socket hang up"))
      )

      await expect(
        runAuthenticatedQuery(mutationWith(`packer: SELLER`), context)
      ).rejects.toThrow("socket hang up")
    })
  })

  describe("externalImageUrls", () => {
    const reloadedSubmission = {
      ...updatedSubmission,
      images: [
        { id: "image-1", image_url: "https://example.com/1.jpg" },
        { id: "image-2", image_url: "https://example.com/2.jpg" },
      ],
    }

    beforeEach(() => {
      context.meCreateResaleSubmissionImageLoader = jest.fn(() =>
        Promise.resolve(updatedSubmission)
      )
      context.meResaleSubmissionLoader = jest.fn(() =>
        Promise.resolve(reloadedSubmission)
      )
    })

    it("adds each photo, then returns the reloaded submission", async () => {
      const response = await runAuthenticatedQuery(
        mutationWith(
          `externalImageUrls: ["https://bucket.s3.amazonaws.com/1.jpg", "https://bucket.s3.amazonaws.com/2.jpg"]`
        ),
        context
      )

      const createImage = context.meCreateResaleSubmissionImageLoader as jest.Mock
      expect(createImage.mock.calls).toEqual([
        [
          "submission-1",
          { image_url: "https://bucket.s3.amazonaws.com/1.jpg" },
        ],
        [
          "submission-1",
          { image_url: "https://bucket.s3.amazonaws.com/2.jpg" },
        ],
      ])
      expect(
        context.meResaleSubmissionLoader as jest.Mock
      ).toHaveBeenCalledWith("submission-1")
      expect(
        response.updateResaleSubmission.resaleSubmissionOrError
      ).toMatchObject({
        __typename: "UpdateResaleSubmissionSuccess",
        resaleSubmission: {
          conditionPhotos: [
            { internalID: "image-1" },
            { internalID: "image-2" },
          ],
        },
      })
    })

    it("skips the update when only photos were given", async () => {
      await runAuthenticatedQuery(
        mutationWith(
          `externalImageUrls: ["https://bucket.s3.amazonaws.com/1.jpg"]`
        ),
        context
      )

      expect(
        context.meUpdateResaleSubmissionLoader as jest.Mock
      ).not.toHaveBeenCalled()
    })

    it("updates the other fields before adding photos", async () => {
      await runAuthenticatedQuery(
        mutationWith(
          `packer: SELLER, externalImageUrls: ["https://bucket.s3.amazonaws.com/1.jpg"]`
        ),
        context
      )

      const update = context.meUpdateResaleSubmissionLoader as jest.Mock
      const createImage = context.meCreateResaleSubmissionImageLoader as jest.Mock
      expect(update).toHaveBeenCalledWith("submission-1", { packer: "seller" })
      expect(update.mock.invocationCallOrder[0]).toBeLessThan(
        createImage.mock.invocationCallOrder[0]
      )
    })

    it("rejects more than 10 photos without calling Gravity", async () => {
      const urls = Array.from(
        { length: 11 },
        (_, i) => `"https://bucket.s3.amazonaws.com/${i}.jpg"`
      )

      await expect(
        runAuthenticatedQuery(
          mutationWith(`externalImageUrls: [${urls.join(", ")}]`),
          context
        )
      ).rejects.toThrow("at most 10 condition photos")

      expect(
        context.meCreateResaleSubmissionImageLoader as jest.Mock
      ).not.toHaveBeenCalled()
    })

    it("returns a failure when Gravity rejects a photo", async () => {
      context.meCreateResaleSubmissionImageLoader = jest.fn(() =>
        Promise.reject(
          new HTTPError("Bad Request", 400, {
            type: "param_error",
            message: "Submission already has 10 images",
          })
        )
      )

      const response = await runAuthenticatedQuery(
        mutationWith(
          `externalImageUrls: ["https://bucket.s3.amazonaws.com/1.jpg"]`
        ),
        context
      )

      expect(response.updateResaleSubmission.resaleSubmissionOrError).toEqual({
        __typename: "UpdateResaleSubmissionFailure",
        mutationError: {
          type: "param_error",
          message: "Submission already has 10 images",
          statusCode: 400,
          fieldErrors: null,
        },
      })
      expect(
        context.meResaleSubmissionLoader as jest.Mock
      ).not.toHaveBeenCalled()
    })
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutationWith(`packer: SELLER`), {})).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })
})
