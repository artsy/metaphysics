import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CommerceOptInMutation", () => {
  const mutation = gql`
    mutation {
      commerceOptIn(input: { id: "commerce-test-partner" }) {
        __typename
        commerceOptInMutationOrError {
          __typename
          ... on CommerceOptInSuccess {
            updatedCommerceOptIn {
              count
            }
          }
          ... on CommerceOptInFailure {
            mutationError {
              error
            }
          }
        }
      }
    }
  `

  describe("Opt artworks for a given partner into Commerce", () => {
    describe("when successful", () => {
      const successfulResponse = {
        success: 0,
        errors: {
          count: 0,
          ids: [],
        },
      }

      const context = {
        optInArtworksIntoCommerceLoader: () =>
          Promise.resolve(successfulResponse),
      }

      it("opts eligible artworks into BNMO", async () => {
        const updatedCommerceOptIn = await runAuthenticatedQuery(
          mutation,
          context
        )

        expect(updatedCommerceOptIn).toEqual({
          commerceOptIn: {
            __typename: "CommerceOptInMutationPayload",
            commerceOptInMutationOrError: {
              __typename: "CommerceOptInSuccess",
              updatedCommerceOptIn: {
                count: 0,
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
        optInArtworksIntoCommerceLoader: () => Promise.resolve(failureResponse),
      }

      it("returns an error", async () => {
        const updatedCommerceOptIn = await runAuthenticatedQuery(
          mutation,
          context
        )

        expect(updatedCommerceOptIn).toEqual({
          commerceOptIn: {
            __typename: "CommerceOptInMutationPayload",
            commerceOptInMutationOrError: {
              __typename: "CommerceOptInSuccess",
              updatedCommerceOptIn: {
                count: null,
              },
            },
          },
        })
      })
    })
  })
})
