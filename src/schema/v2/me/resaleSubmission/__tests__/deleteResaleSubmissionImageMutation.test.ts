import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

const mutation = gql`
  mutation {
    deleteResaleSubmissionImage(
      input: { id: "submission-1", imageID: "image-1" }
    ) {
      resaleSubmissionOrError {
        __typename
        ... on DeleteResaleSubmissionImageSuccess {
          resaleSubmission {
            internalID
            conditionPhotos {
              internalID
            }
          }
        }
        ... on DeleteResaleSubmissionImageFailure {
          mutationError {
            type
            message
            statusCode
          }
        }
      }
    }
  }
`

const submission = {
  id: "submission-1",
  submitted_artwork_id: "artwork-1",
  state: "accepted",
  images: [{ id: "image-2", image_url: "https://example.com/2.jpg" }],
}

let context: Partial<ResolverContext>

beforeEach(() => {
  context = {
    meDeleteResaleSubmissionImageLoader: jest.fn(() =>
      Promise.resolve(submission)
    ),
  }
})

describe("deleteResaleSubmissionImage", () => {
  it("removes the photo and returns the updated submission", async () => {
    const response = await runAuthenticatedQuery(mutation, context)

    expect(
      context.meDeleteResaleSubmissionImageLoader as jest.Mock
    ).toHaveBeenCalledWith({ id: "submission-1", imageID: "image-1" })
    expect(
      response.deleteResaleSubmissionImage.resaleSubmissionOrError
    ).toEqual({
      __typename: "DeleteResaleSubmissionImageSuccess",
      resaleSubmission: {
        internalID: "submission-1",
        conditionPhotos: [{ internalID: "image-2" }],
      },
    })
  })

  it("returns a failure when Gravity rejects the delete", async () => {
    context.meDeleteResaleSubmissionImageLoader = jest.fn(() =>
      Promise.reject(new HTTPError("Not Found", 404, { error: "Not Found" }))
    )

    const response = await runAuthenticatedQuery(mutation, context)

    expect(
      response.deleteResaleSubmissionImage.resaleSubmissionOrError
    ).toEqual({
      __typename: "DeleteResaleSubmissionImageFailure",
      mutationError: { type: "error", message: "Not Found", statusCode: 404 },
    })
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })
})
