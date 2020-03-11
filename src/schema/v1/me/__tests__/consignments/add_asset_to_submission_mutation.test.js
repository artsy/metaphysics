/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v1/test/utils"
import gql from "lib/gql"

// FIXME: We're now stitching. Remove these files once this work settles
xdescribe("addAssetToConsignmentSubmission", () => {
  it("creates a submission and returns its new data payload", () => {
    const mutation = gql`
      mutation {
        addAssetToConsignmentSubmission(
          input: {
            asset_type: "image"
            gemini_token: "12345"
            submission_id: "123"
            clientMutationId: "123"
          }
        ) {
          asset {
            submission_id
            gemini_token
          }
        }
      }
    `

    const context = {
      assetCreateLoader: () =>
        Promise.resolve({
          id: "106",
          gemini_token: "12345",
          submission_id: "123",
        }),
    }

    expect.assertions(1)
    return runAuthenticatedQuery(mutation, context).then(data => {
      expect(data).toMatchSnapshot()
    })
  })
})
