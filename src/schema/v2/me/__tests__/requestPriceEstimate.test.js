/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("Request Price Estimate", () => {
  const submittedPriceEstimateParams = {
    artwork_id: "621f87fd17838f000eaa6e4b",
    requester_name: "Mama Mia",
    requester_email: "tester@test.com",
    requester_phone_number: "+49123456",
  }
  const loaders = {
    requestPriceEstimateLoader: () =>
      Promise.resolve(submittedPriceEstimateParams),
  }

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

  it("requests price estimate and returns submitted params", async () => {
    const data = await runAuthenticatedQuery(query, loaders)
    expect(data).toEqual({
      requestPriceEstimate: {
        priceEstimateParamsOrError: {
          submittedPriceEstimateParams: {
            artworkId: "621f87fd17838f000eaa6e4b",
            requesterEmail: "tester@test.com",
            requesterName: "Mama Mia",
          },
        },
      },
    })
  })
})
