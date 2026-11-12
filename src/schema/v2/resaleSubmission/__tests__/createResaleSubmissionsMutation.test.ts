import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import {
  AUCTION_ARTWORK_ID,
  MARKETPLACE_ARTWORK_ID,
  REJECTED_ARTWORK_ID,
  stubLoaders,
} from "./fixtures"

const mutation = (artworkIDs: string[]) => gql`
  mutation {
    createResaleSubmissions(input: { artworkIDs: ${JSON.stringify(
      artworkIDs
    )} }) {
      resaleSubmissionsOrError {
        __typename
        ... on CreateResaleSubmissionsSuccess {
          results {
            artworkID
            resaleSubmission {
              internalID
              state
              channel
              rejectionReasons
            }
            error {
              message
              statusCode
            }
          }
        }
        ... on CreateResaleSubmissionsFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

const create = async (artworkIDs: string[], loaders: any = stubLoaders()) => {
  const { createResaleSubmissions } = await runAuthenticatedQuery(
    mutation(artworkIDs),
    loaders
  )
  return createResaleSubmissions.resaleSubmissionsOrError
}

const artworkID = (n: number) => n.toString(16).padStart(24, "0")

describe("createResaleSubmissions", () => {
  it("returns one result per work, in order, with rejected works as successes", async () => {
    const response = await create([
      MARKETPLACE_ARTWORK_ID,
      AUCTION_ARTWORK_ID,
      REJECTED_ARTWORK_ID,
    ])

    expect(response).toEqual({
      __typename: "CreateResaleSubmissionsSuccess",
      results: [
        {
          artworkID: MARKETPLACE_ARTWORK_ID,
          resaleSubmission: {
            internalID: `stub-${MARKETPLACE_ARTWORK_ID}`,
            state: "ACCEPTED",
            channel: "MARKETPLACE",
            rejectionReasons: [],
          },
          error: null,
        },
        {
          artworkID: AUCTION_ARTWORK_ID,
          resaleSubmission: {
            internalID: `stub-${AUCTION_ARTWORK_ID}`,
            state: "ACCEPTED",
            channel: "AUCTION",
            rejectionReasons: [],
          },
          error: null,
        },
        {
          artworkID: REJECTED_ARTWORK_ID,
          resaleSubmission: {
            internalID: `stub-${REJECTED_ARTWORK_ID}`,
            state: "REJECTED",
            channel: null,
            rejectionReasons: ["OUTSIDE_US"],
          },
          error: null,
        },
      ],
    })
  })

  it("returns an error for a work that already has an active submission and keeps the others", async () => {
    const message =
      "Validation failed: Submitted artwork already has an active resale submission"
    const createResaleSubmissionLoader = jest.fn(({ submitted_artwork_id }) =>
      submitted_artwork_id === AUCTION_ARTWORK_ID
        ? Promise.reject(
            new HTTPError(
              "Bad Request",
              400,
              JSON.stringify({ type: "param_error", message })
            )
          )
        : stubLoaders().createResaleSubmissionLoader({ submitted_artwork_id })
    )

    const response = await create(
      [MARKETPLACE_ARTWORK_ID, AUCTION_ARTWORK_ID],
      { createResaleSubmissionLoader }
    )

    expect(createResaleSubmissionLoader).toHaveBeenCalledWith({
      submitted_artwork_id: MARKETPLACE_ARTWORK_ID,
    })
    expect(response.results).toEqual([
      expect.objectContaining({
        artworkID: MARKETPLACE_ARTWORK_ID,
        resaleSubmission: expect.objectContaining({ state: "ACCEPTED" }),
        error: null,
      }),
      {
        artworkID: AUCTION_ARTWORK_ID,
        resaleSubmission: null,
        error: { message, statusCode: 400 },
      },
    ])
  })

  it("sends a repeated work to Gravity once", async () => {
    const createResaleSubmissionLoader = jest.fn(
      stubLoaders().createResaleSubmissionLoader
    )

    const response = await create(
      [MARKETPLACE_ARTWORK_ID, MARKETPLACE_ARTWORK_ID],
      { createResaleSubmissionLoader }
    )

    expect(response.results).toHaveLength(1)
    expect(createResaleSubmissionLoader).toHaveBeenCalledTimes(1)
  })

  it("accepts 10 works", async () => {
    const ids = Array.from({ length: 10 }, (_, i) => artworkID(i))

    expect((await create(ids)).results).toHaveLength(10)
  })

  it("fails the whole request for more than 10 works", async () => {
    const createResaleSubmissionLoader = jest.fn()
    const ids = Array.from({ length: 11 }, (_, i) => artworkID(i))

    expect(await create(ids, { createResaleSubmissionLoader })).toEqual({
      __typename: "CreateResaleSubmissionsFailure",
      mutationError: { message: "artworkIDs can't have more than 10 works" },
    })
    expect(createResaleSubmissionLoader).not.toHaveBeenCalled()
  })

  it("fails the whole request for an empty list", async () => {
    expect(await create([])).toEqual({
      __typename: "CreateResaleSubmissionsFailure",
      mutationError: { message: "artworkIDs can't be empty" },
    })
  })

  it("fails the whole request when any ID is a slug", async () => {
    const createResaleSubmissionLoader = jest.fn()

    expect(
      await create([MARKETPLACE_ARTWORK_ID, "andy-warhol-soup"], {
        createResaleSubmissionLoader,
      })
    ).toEqual({
      __typename: "CreateResaleSubmissionsFailure",
      mutationError: { message: "artworkIDs must be artwork internalIDs" },
    })
    expect(createResaleSubmissionLoader).not.toHaveBeenCalled()
  })

  it("errors when signed out", async () => {
    await expect(
      runQuery(mutation([MARKETPLACE_ARTWORK_ID]), {})
    ).rejects.toThrow("You need to be signed in to perform this action")
  })
})
