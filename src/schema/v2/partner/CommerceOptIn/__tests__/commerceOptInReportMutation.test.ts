import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CommerceOptInReportMutation", () => {
  const mutation = gql`
    mutation {
      commerceOptInReport(input: { id: "commerce-test-partner" }) {
        __typename
        commerceOptInReportMutationOrError {
          __typename
          ... on CommerceOptInReportSuccess {
            createdCommerceOptInReport {
              message
            }
          }
          ... on CommerceOptInReportFailure {
            mutationError {
              error
            }
          }
        }
      }
    }
  `

  describe("Create a report containing data about commerce opt in eligibility for a given partner", () => {
    describe("when successful", () => {
      const successfulResponse = {
        message: "success",
      }

      const context = {
        createCommerceOptInEligibleArtworksReportLoader: () =>
          Promise.resolve(successfulResponse),
      }

      it("sends the report to the user", async () => {
        const createdCommerceOptInReport = await runAuthenticatedQuery(
          mutation,
          context
        )

        expect(createdCommerceOptInReport).toEqual({
          commerceOptInReport: {
            __typename: "CommerceOptInReportMutationPayload",
            commerceOptInReportMutationOrError: {
              __typename: "CommerceOptInReportSuccess",
              createdCommerceOptInReport: {
                message: "success",
              },
            },
          },
        })
      })
    })

    describe("when failure", () => {
      const failureResponse = {
        type: "param_error",
        message: "Invalid parameters.",
        detail: {
          exact_price: ["does not have a valid value"],
        },
      }

      const context = {
        createCommerceOptInEligibleArtworksReportLoader: () =>
          Promise.resolve(failureResponse),
      }

      it("returns an error", async () => {
        const createdCommerceOptInReport = await runAuthenticatedQuery(
          mutation,
          context
        )

        expect(createdCommerceOptInReport).toEqual({
          commerceOptInReport: {
            __typename: "CommerceOptInReportMutationPayload",
            commerceOptInReportMutationOrError: {
              __typename: "CommerceOptInReportSuccess",
              createdCommerceOptInReport: {
                message: "Invalid parameters.",
              },
            },
          },
        })
      })
    })
  })
})
