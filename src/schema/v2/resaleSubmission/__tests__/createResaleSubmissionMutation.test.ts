import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import {
  AUCTION_ARTWORK_ID,
  MARKETPLACE_ARTWORK_ID,
  REJECTED_ARTWORK_ID,
  stubLoaders,
} from "./fixtures"

const mutation = (artworkID: string) => gql`
  mutation {
    createResaleSubmission(input: { artworkID: "${artworkID}" }) {
      responseOrError {
        __typename
        ... on CreateResaleSubmissionSuccess {
          resaleSubmission {
            internalID
            state
            channel
            rejectionReasons
          }
        }
        ... on CreateResaleSubmissionFailure {
          mutationError {
            message
            statusCode
          }
        }
      }
    }
  }
`

const create = async (artworkID: string, loaders: any = stubLoaders()) => {
  const { createResaleSubmission } = await runAuthenticatedQuery(
    mutation(artworkID),
    loaders
  )
  return createResaleSubmission.responseOrError
}

describe("createResaleSubmission", () => {
  it("accepts a marketplace work", async () => {
    expect(await create(MARKETPLACE_ARTWORK_ID)).toEqual({
      __typename: "CreateResaleSubmissionSuccess",
      resaleSubmission: {
        internalID: `stub-${MARKETPLACE_ARTWORK_ID}`,
        state: "ACCEPTED",
        channel: "MARKETPLACE",
        rejectionReasons: [],
      },
    })
  })

  it("accepts an auction work", async () => {
    expect(await create(AUCTION_ARTWORK_ID)).toMatchObject({
      __typename: "CreateResaleSubmissionSuccess",
      resaleSubmission: { state: "ACCEPTED", channel: "AUCTION" },
    })
  })

  it("returns a rejected assessment as a success", async () => {
    expect(await create(REJECTED_ARTWORK_ID)).toMatchObject({
      __typename: "CreateResaleSubmissionSuccess",
      resaleSubmission: {
        state: "REJECTED",
        channel: null,
        rejectionReasons: ["OUTSIDE_US"],
      },
    })
  })

  it("returns the same submission when called twice for one work", async () => {
    const first = await create(MARKETPLACE_ARTWORK_ID)
    const second = await create(MARKETPLACE_ARTWORK_ID)

    expect(second.resaleSubmission.internalID).toEqual(
      first.resaleSubmission.internalID
    )
  })

  it("sends the artwork ID to the loader", async () => {
    const loaders = stubLoaders()
    const createResaleSubmissionLoader = jest.fn(
      loaders.createResaleSubmissionLoader
    )

    await create(MARKETPLACE_ARTWORK_ID, { createResaleSubmissionLoader })

    expect(createResaleSubmissionLoader).toHaveBeenCalledWith({
      artwork_id: MARKETPLACE_ARTWORK_ID,
    })
  })

  it("fails for a slug without calling the loader", async () => {
    const createResaleSubmissionLoader = jest.fn()

    expect(
      await create("andy-warhol-skull", { createResaleSubmissionLoader })
    ).toEqual({
      __typename: "CreateResaleSubmissionFailure",
      mutationError: {
        message: "artworkID must be an artwork internalID",
        statusCode: null,
      },
    })
    expect(createResaleSubmissionLoader).not.toHaveBeenCalled()
  })

  it("returns a Gravity error as a failure", async () => {
    const createResaleSubmissionLoader = jest.fn(() =>
      Promise.reject(
        new HTTPError("Unprocessable", 422, {
          error: "Submitted artwork must be in the user's My Collection",
        })
      )
    )

    expect(
      await create(MARKETPLACE_ARTWORK_ID, { createResaleSubmissionLoader })
    ).toEqual({
      __typename: "CreateResaleSubmissionFailure",
      mutationError: {
        message: "Submitted artwork must be in the user's My Collection",
        statusCode: 422,
      },
    })
  })

  it("throws when signed out", async () => {
    await expect(
      runQuery(mutation(MARKETPLACE_ARTWORK_ID), {})
    ).rejects.toThrow("You need to be signed in to perform this action")
  })
})
