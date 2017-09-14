import { runAuthenticatedQuery } from "test/utils"

describe("addAssetToConsignmentSubmission", () => {
  it("creates a submission and returns its new data payload", () => {
    const mutation = `
      mutation {
        addAssetToConsignmentSubmission(input:
          { asset_type: "image", gemini_token: "12345", submission_id: "123", clientMutationId: "123" }
        ){
          asset {
            submission_id
            gemini_token
          }
        }
      }
    `

    const rootValue = {
      assetCreateLoader: () =>
        Promise.resolve({
          id: "106",
          gemini_token: "12345",
          submission_id: "123",
        }),
    }

    return runAuthenticatedQuery(mutation, rootValue).then(({ assetCreateLoader }) => {
      expect(assetCreateLoader).toMatchSnapshot()
    })
  })
})
