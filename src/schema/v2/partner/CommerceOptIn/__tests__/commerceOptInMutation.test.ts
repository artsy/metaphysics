import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CommerceOptInMutation", () => {
  const mutation = gql`
    mutation {
      CommerceOptIn() {
        CommerceOptInOrError {
          __typename
          ... on CommerceOptInSuccess {
            // 
          }
          ... on CommerceOptInFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("opts eligible artworks into BNMO", async () => {
    const context = {
      commerceOptInLoader: () =>
        Promise.resolve({
          //
        }),
    }

    const updatedCommerceOptIn = await runAuthenticatedQuery(mutation, context)

    expect(updatedCommerceOptIn).toEqual({
      //
    })
  })

  describe("when failure", () => {
    it("returns an error", async () => {
      const context = {
        //
      }

      const updatedCommerceOptIn = await runAuthenticatedQuery(
        mutation,
        context
      )

      expect(updatedCommerceOptIn).toEqual({
        //
      })
    })
  })
})
