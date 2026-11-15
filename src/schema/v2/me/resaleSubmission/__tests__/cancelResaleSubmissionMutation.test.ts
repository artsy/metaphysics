import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

const mutation = gql`
  mutation {
    cancelResaleSubmission(input: { id: "submission-1" }) {
      resaleSubmissionOrError {
        __typename
        ... on CancelResaleSubmissionSuccess {
          resaleSubmission {
            internalID
            state
            canceledAt(format: "YYYY-MM-DD")
          }
        }
        ... on CancelResaleSubmissionFailure {
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

const canceledSubmission = {
  id: "submission-1",
  user_id: "user-42",
  submitted_artwork_id: "artwork-1",
  state: "canceled",
  channel: "marketplace",
  rejection_reasons: [],
  price_currency_code: "USD",
  missing_requirements: [],
  canceled_at: "2026-11-14T10:00:00.000Z",
}

let context: Partial<ResolverContext>

beforeEach(() => {
  context = {
    meCancelResaleSubmissionLoader: jest.fn(() =>
      Promise.resolve(canceledSubmission)
    ),
  }
})

describe("cancelResaleSubmission", () => {
  it("cancels the submission in Gravity", async () => {
    await runAuthenticatedQuery(mutation, context)

    expect(
      context.meCancelResaleSubmissionLoader as jest.Mock
    ).toHaveBeenCalledWith("submission-1")
  })

  it("returns the canceled submission", async () => {
    const response = await runAuthenticatedQuery(mutation, context)

    expect(response.cancelResaleSubmission.resaleSubmissionOrError).toEqual({
      __typename: "CancelResaleSubmissionSuccess",
      resaleSubmission: {
        internalID: "submission-1",
        state: "CANCELED",
        canceledAt: "2026-11-14",
      },
    })
  })

  it("returns a failure when Gravity refuses to cancel", async () => {
    context.meCancelResaleSubmissionLoader = jest.fn(() =>
      Promise.reject(
        new HTTPError("Bad Request", 400, {
          error: "Cannot cancel a listed submission",
        })
      )
    )

    const response = await runAuthenticatedQuery(mutation, context)

    expect(response.cancelResaleSubmission.resaleSubmissionOrError).toEqual({
      __typename: "CancelResaleSubmissionFailure",
      mutationError: {
        type: "error",
        message: "Cannot cancel a listed submission",
        statusCode: 400,
        fieldErrors: null,
      },
    })
  })

  it("returns a failure for a 404", async () => {
    context.meCancelResaleSubmissionLoader = jest.fn(() =>
      Promise.reject(new HTTPError("Not Found", 404, { error: "Not Found" }))
    )

    const response = await runAuthenticatedQuery(mutation, context)

    expect(response.cancelResaleSubmission.resaleSubmissionOrError).toEqual({
      __typename: "CancelResaleSubmissionFailure",
      mutationError: {
        type: "error",
        message: "Not Found",
        statusCode: 404,
        fieldErrors: null,
      },
    })
  })

  it("rethrows errors that did not come from Gravity", async () => {
    context.meCancelResaleSubmissionLoader = jest.fn(() =>
      Promise.reject(new Error("socket hang up"))
    )

    await expect(runAuthenticatedQuery(mutation, context)).rejects.toThrow(
      "socket hang up"
    )
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })
})
