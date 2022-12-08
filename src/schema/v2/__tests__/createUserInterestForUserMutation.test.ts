import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    createUserInterestForUser(
      input: {
        category: INTERESTED_IN_COLLECTING
        interestId: "example"
        interestType: ARTIST
        body: "example body"
        userId: "person"
        ownerType: USER_SALE_PROFILE
      }
    ) {
      userInterestOrError {
        __typename
        ... on createUserInterestForUserSuccess {
          userInterest {
            body
            interest {
              __typename
              ... on Artist {
                name
                birthday
              }
            }
          }
        }
        ... on createUserInterestForUserFailure {
          mutationError {
            type
            message
            detail
          }
        }
      }
    }
  }
`

describe("createUserInterestForUserMutation", () => {
  describe("on success", () => {
    const artistInterest = {
      id: "example",
      body: "example body",
      interest: {
        name: "example name",
        birthday: "",
      },
    }

    const mockCreateUserInterestLoader = jest.fn()

    const context = {
      createUserInterestLoader: mockCreateUserInterestLoader,
    }

    beforeEach(() => {
      mockCreateUserInterestLoader.mockResolvedValue(
        Promise.resolve(artistInterest)
      )
    })

    afterEach(() => {
      mockCreateUserInterestLoader.mockReset()
    })

    it("returns a user interest", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(mockCreateUserInterestLoader).toBeCalledWith({
        category: "interested_in_collecting",
        interest_id: "example",
        interest_type: "Artist",
        body: "example body",
        user_id: "person",
        owner_type: "UserSaleProfile",
      })

      expect(res).toEqual({
        createUserInterestForUser: {
          userInterestOrError: {
            __typename: "createUserInterestForUserSuccess",
            userInterest: {
              body: "example body",
              interest: {
                __typename: "Artist",
                name: "example name",
                birthday: "",
              },
            },
          },
        },
      })
    })
  })

  describe("on failure", () => {
    const context = {
      createUserInterestLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/user_interest - {"type": "error","message":"example message","detail":"example detail"}`
          )
        ),
    }

    it("returns a mutation error", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(res).toEqual({
        createUserInterestForUser: {
          userInterestOrError: {
            __typename: "createUserInterestForUserFailure",
            mutationError: {
              type: "error",
              message: "example message",
              detail: "example detail",
            },
          },
        },
      })
    })
  })
})
