/* eslint-disable promise/always-return */
import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    createUserSaleProfile(
      input: { userId: "xyz321", requireBidderApproval: true }
    ) {
      userSaleProfileOrError {
        __typename
        ... on CreateUserSaleProfileSuccess {
          userSaleProfile {
            name
            requireBidderApproval
          }
        }
        ... on CreateUserSaleProfileFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("Create a sale profile for a user", () => {
  describe("when succesfull", () => {
    const userSaleProfile = {
      id: "abc123",
      name: "Percy Cat",
      require_bidder_approval: true,
    }

    const context = {
      createUserSaleProfileLoader: () => Promise.resolve(userSaleProfile),
    }

    it("creates a user sale profile", async () => {
      const data = await runAuthenticatedQuery(mutation, context)
      expect(data).toEqual({
        createUserSaleProfile: {
          userSaleProfileOrError: {
            __typename: "CreateUserSaleProfileSuccess",
            userSaleProfile: {
              name: "Percy Cat",
              requireBidderApproval: true,
            },
          },
        },
      })
    })
  })

  describe("when failure", () => {
    it("return an error", async () => {
      const context = {
        createUserSaleProfileLoader: () =>
          Promise.reject(
            new Error(
              `https://stagingapi.artsy.net/api/v1/user_sale_profile - {"type":"error","message":"Sale Profile Not Found"}`
            )
          ),
      }

      const response = await runAuthenticatedQuery(mutation, context)

      expect(response).toEqual({
        createUserSaleProfile: {
          userSaleProfileOrError: {
            __typename: "CreateUserSaleProfileFailure",
            mutationError: {
              message: "Sale Profile Not Found",
            },
          },
        },
      })
    })
  })
})
