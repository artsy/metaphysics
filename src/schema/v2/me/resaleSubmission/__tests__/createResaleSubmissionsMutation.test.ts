import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"
import { MAX_ARTWORK_IDS } from "../createResaleSubmissionsMutation"

const FIRST_ID = "5f0000000000000000000001"
const SECOND_ID = "5f0000000000000000000002"
const THIRD_ID = "5f0000000000000000000003"

const mutationWith = (artworkIDs: string[]) => gql`
  mutation {
    createResaleSubmissions(input: { artworkIDs: ${JSON.stringify(
      artworkIDs
    )} }) {
      resaleSubmissionsOrErrors {
        __typename
        ... on CreateResaleSubmissionSuccess {
          artworkID
          resaleSubmission {
            internalID
            state
            channel
            submittedArtworkID
          }
        }
        ... on CreateResaleSubmissionFailure {
          artworkID
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

const submissionFor = (artworkID: string, overrides = {}) => ({
  id: `submission-for-${artworkID}`,
  user_id: "user-42",
  submitted_artwork_id: artworkID,
  state: "accepted",
  channel: "marketplace",
  rejection_reasons: [],
  price_currency_code: "USD",
  missing_requirements: [],
  ...overrides,
})

let context: Partial<ResolverContext>

beforeEach(() => {
  context = {
    meCreateResaleSubmissionLoader: jest.fn(({ submitted_artwork_id }: any) =>
      Promise.resolve(submissionFor(submitted_artwork_id))
    ),
  }
})

describe("createResaleSubmissions", () => {
  it("creates one submission per artwork in Gravity", async () => {
    await runAuthenticatedQuery(mutationWith([FIRST_ID, SECOND_ID]), context)

    const loader = context.meCreateResaleSubmissionLoader as jest.Mock

    expect(loader).toHaveBeenCalledTimes(2)
    expect(loader).toHaveBeenCalledWith({ submitted_artwork_id: FIRST_ID })
    expect(loader).toHaveBeenCalledWith({ submitted_artwork_id: SECOND_ID })
  })

  it("returns a result per artwork in the order sent", async () => {
    const response = await runAuthenticatedQuery(
      mutationWith([SECOND_ID, FIRST_ID]),
      context
    )

    expect(response.createResaleSubmissions.resaleSubmissionsOrErrors).toEqual([
      {
        __typename: "CreateResaleSubmissionSuccess",
        artworkID: SECOND_ID,
        resaleSubmission: {
          internalID: `submission-for-${SECOND_ID}`,
          state: "ACCEPTED",
          channel: "MARKETPLACE",
          submittedArtworkID: SECOND_ID,
        },
      },
      {
        __typename: "CreateResaleSubmissionSuccess",
        artworkID: FIRST_ID,
        resaleSubmission: {
          internalID: `submission-for-${FIRST_ID}`,
          state: "ACCEPTED",
          channel: "MARKETPLACE",
          submittedArtworkID: FIRST_ID,
        },
      },
    ])
  })

  it("sends a repeated artwork once", async () => {
    const response = await runAuthenticatedQuery(
      mutationWith([FIRST_ID, SECOND_ID, FIRST_ID]),
      context
    )

    expect(
      context.meCreateResaleSubmissionLoader as jest.Mock
    ).toHaveBeenCalledTimes(2)
    expect(
      response.createResaleSubmissions.resaleSubmissionsOrErrors.map(
        (result) => result.artworkID
      )
    ).toEqual([FIRST_ID, SECOND_ID])
  })

  it("treats a rejected assessment as a success, not an error", async () => {
    context.meCreateResaleSubmissionLoader = jest.fn(
      ({ submitted_artwork_id }: any) =>
        Promise.resolve(
          submissionFor(submitted_artwork_id, {
            state: "rejected",
            channel: null,
            rejection_reasons: ["outside_us"],
          })
        )
    )

    const response = await runAuthenticatedQuery(
      mutationWith([FIRST_ID]),
      context
    )

    expect(
      response.createResaleSubmissions.resaleSubmissionsOrErrors[0]
    ).toMatchObject({
      __typename: "CreateResaleSubmissionSuccess",
      resaleSubmission: { state: "REJECTED", channel: null },
    })
  })

  describe("when Gravity rejects one artwork", () => {
    beforeEach(() => {
      context.meCreateResaleSubmissionLoader = jest.fn(
        ({ submitted_artwork_id }: any) =>
          submitted_artwork_id === SECOND_ID
            ? Promise.reject(
                new HTTPError("Bad Request", 400, {
                  type: "param_error",
                  message: "Invalid parameters",
                  detail: {
                    submitted_artwork_id: [
                      "already has an active resale submission",
                    ],
                  },
                })
              )
            : Promise.resolve(submissionFor(submitted_artwork_id))
      )
    })

    it("still creates the others", async () => {
      const response = await runAuthenticatedQuery(
        mutationWith([FIRST_ID, SECOND_ID, THIRD_ID]),
        context
      )

      expect(
        response.createResaleSubmissions.resaleSubmissionsOrErrors.map(
          (result) => [result.__typename, result.artworkID]
        )
      ).toEqual([
        ["CreateResaleSubmissionSuccess", FIRST_ID],
        ["CreateResaleSubmissionFailure", SECOND_ID],
        ["CreateResaleSubmissionSuccess", THIRD_ID],
      ])
    })

    it("reports the failure against its artwork", async () => {
      const response = await runAuthenticatedQuery(
        mutationWith([SECOND_ID]),
        context
      )

      expect(
        response.createResaleSubmissions.resaleSubmissionsOrErrors[0]
      ).toEqual({
        __typename: "CreateResaleSubmissionFailure",
        artworkID: SECOND_ID,
        mutationError: {
          type: "param_error",
          message: "Invalid parameters",
          statusCode: 400,
          fieldErrors: [
            {
              name: "submitted_artwork_id",
              message: "already has an active resale submission",
            },
          ],
        },
      })
    })
  })

  it("reports an error that did not come from Gravity against its artwork", async () => {
    context.meCreateResaleSubmissionLoader = jest.fn(() =>
      Promise.reject(new Error("socket hang up"))
    )

    const response = await runAuthenticatedQuery(
      mutationWith([FIRST_ID]),
      context
    )

    expect(
      response.createResaleSubmissions.resaleSubmissionsOrErrors[0]
    ).toMatchObject({
      __typename: "CreateResaleSubmissionFailure",
      artworkID: FIRST_ID,
      mutationError: { message: "socket hang up" },
    })
  })

  describe("input validation", () => {
    it("rejects an empty list without calling Gravity", async () => {
      await expect(
        runAuthenticatedQuery(mutationWith([]), context)
      ).rejects.toThrow("artworkIDs can’t be empty")

      expect(
        context.meCreateResaleSubmissionLoader as jest.Mock
      ).not.toHaveBeenCalled()
    })

    it("rejects more than the maximum number of artworks without calling Gravity", async () => {
      const tooManyIDs = Array.from(
        { length: MAX_ARTWORK_IDS + 1 },
        (_value, index) => `5f${String(index).padStart(22, "0")}`
      )

      await expect(
        runAuthenticatedQuery(mutationWith(tooManyIDs), context)
      ).rejects.toThrow(
        `Cannot submit more than ${MAX_ARTWORK_IDS} artworks at a time`
      )

      expect(
        context.meCreateResaleSubmissionLoader as jest.Mock
      ).not.toHaveBeenCalled()
    })
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutationWith([FIRST_ID]), {})).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })
})
