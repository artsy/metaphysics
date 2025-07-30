/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("Request Price Estimate", () => {
  const query = `
  mutation {
    requestPriceEstimate(input: {
      artworkId: "621f87fd17838f000eaa6e4b",
      requesterName: "Mama Mia",
      requesterEmail: "kizito.egeonu@gmail.com",
      requesterPhoneNumber: null }) {
        priceEstimateParamsOrError {
          ... on RequestPriceEstimatedMutationSuccess {
            submittedPriceEstimateParams {
              artworkId
              requesterName
              requesterEmail
            }
          }
          ... on RequestPriceEstimatedMutationFailure {
            mutationError {
              error
            }
          }
        }
    }
  }
  `

  it("throws error since price estimates are no longer accepted", async () => {
    await expect(runAuthenticatedQuery(query, {})).rejects.toThrow(
      "Artwork submissions are not accepted at this time."
    )
  })
})
