import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    deleteOrderedSet(input: { id: "abc123" }) {
      orderedSetOrError {
        __typename
        ... on deleteOrderedSetSuccess {
          set {
            description
            itemType
            ownerType
            published
          }
        }
        ... on deleteOrderedSetFailure {
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

describe("deleteOrderedSetMutation", () => {
  describe("on success", () => {
    const set = {
      description: "Example description",
      id: "fgh456",
      item_type: "Artist",
      owner_type: "Feature",
      published: true,
    }

    const mockDeleteSetLoader = jest.fn()

    const context = {
      deleteSetLoader: mockDeleteSetLoader,
    }

    beforeEach(() => {
      mockDeleteSetLoader.mockResolvedValue(Promise.resolve(set))
    })

    afterEach(() => {
      mockDeleteSetLoader.mockReset()
    })

    it("returns a Artist", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(mockDeleteSetLoader).toBeCalledWith("abc123")

      expect(res).toEqual({
        deleteOrderedSet: {
          orderedSetOrError: {
            __typename: "deleteOrderedSetSuccess",
            set: {
              description: "Example description",
              itemType: "Artist",
              ownerType: "Feature",
              published: true,
            },
          },
        },
      })
    })
  })

  describe("on failure", () => {
    const context = {
      deleteSetLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/user_interest - {"type": "error","message":"example message","detail":"example detail"}`
          )
        ),
    }

    it("returns a mutation error", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(res).toEqual({
        deleteOrderedSet: {
          orderedSetOrError: {
            __typename: "deleteOrderedSetFailure",
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
