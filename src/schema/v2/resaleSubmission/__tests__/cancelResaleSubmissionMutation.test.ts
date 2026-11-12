import gql from "lib/gql"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import {
  MARKETPLACE_ARTWORK_ID,
  REJECTED_ARTWORK_ID,
  stubLoaders,
} from "./fixtures"

const mutation = (id: string) => gql`
  mutation {
    cancelResaleSubmission(input: { id: "${id}" }) {
      resaleSubmissionOrError {
        __typename
        ... on CancelResaleSubmissionSuccess {
          resaleSubmission {
            internalID
            state
            canceledAt
          }
        }
        ... on CancelResaleSubmissionFailure {
          mutationError {
            message
            statusCode
          }
        }
      }
    }
  }
`

const cancel = async (id: string, loaders: any = stubLoaders()) => {
  const { cancelResaleSubmission } = await runAuthenticatedQuery(
    mutation(id),
    loaders
  )
  return cancelResaleSubmission.resaleSubmissionOrError
}

describe("cancelResaleSubmission", () => {
  it("cancels an accepted submission", async () => {
    expect(await cancel(`stub-${MARKETPLACE_ARTWORK_ID}`)).toEqual({
      __typename: "CancelResaleSubmissionSuccess",
      resaleSubmission: {
        internalID: `stub-${MARKETPLACE_ARTWORK_ID}`,
        state: "CANCELED",
        canceledAt: expect.any(String),
      },
    })
  })

  it("fails for a submission that isn't accepted", async () => {
    expect(await cancel(`stub-${REJECTED_ARTWORK_ID}`)).toEqual({
      __typename: "CancelResaleSubmissionFailure",
      mutationError: {
        message: "Cannot cancel a rejected submission",
        statusCode: 400,
      },
    })
  })

  it("fails for an unknown submission", async () => {
    expect(await cancel("not-a-stub")).toEqual({
      __typename: "CancelResaleSubmissionFailure",
      mutationError: {
        message: "Resale submission not found",
        statusCode: 404,
      },
    })
  })

  it("returns an error that isn't from Gravity as a failure", async () => {
    const cancelResaleSubmissionLoader = jest.fn(() =>
      Promise.reject(new Error("socket hang up"))
    )

    expect(
      await cancel(`stub-${MARKETPLACE_ARTWORK_ID}`, {
        cancelResaleSubmissionLoader,
      })
    ).toEqual({
      __typename: "CancelResaleSubmissionFailure",
      mutationError: { message: "socket hang up", statusCode: null },
    })
  })

  it("errors when signed out", async () => {
    await expect(
      runQuery(mutation(`stub-${MARKETPLACE_ARTWORK_ID}`), {})
    ).rejects.toThrow("You need to be signed in to perform this action")
  })
})
