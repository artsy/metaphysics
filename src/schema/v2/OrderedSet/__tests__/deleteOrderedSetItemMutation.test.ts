import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    deleteOrderedSetItem(input: { id: "abc123", itemId: "xyz789" }) {
      deleteOrderedSetItemResponseOrError {
        __typename
        ... on deleteOrderedSetItemSuccess {
          setItem {
            ... on Artist {
              name
              hometown
            }
          }
          set {
            internalID
            itemType
          }
        }
        ... on deleteOrderedSetItemFailure {
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

describe("deleteOrderedSetItemMutation", () => {
  describe("on success", () => {
    const artist = {
      id: "xyz789",
      name: "percy-z",
      hometown: "catville",
    }
    const set = {
      id: "abc123",
      item_type: "Artist",
    }

    const mockDeleteSetItemLoader = jest.fn()
    const mockSetLoader = jest.fn()

    const context = {
      deleteSetItemLoader: mockDeleteSetItemLoader,
      setLoader: mockSetLoader,
    }

    beforeEach(() => {
      mockSetLoader.mockResolvedValue(Promise.resolve(set))
      mockDeleteSetItemLoader.mockResolvedValue(Promise.resolve(artist))
    })

    afterEach(() => {
      mockSetLoader.mockReset()
      mockDeleteSetItemLoader.mockReset()
    })

    it("returns the set and item", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(mockDeleteSetItemLoader).toBeCalledWith({
        id: "abc123",
        itemId: "xyz789",
      })

      expect(res).toEqual({
        deleteOrderedSetItem: {
          deleteOrderedSetItemResponseOrError: {
            __typename: "deleteOrderedSetItemSuccess",
            setItem: {
              name: "percy-z",
              hometown: "catville",
            },
            set: {
              internalID: "abc123",
              itemType: "Artist",
            },
          },
        },
      })
    })
  })

  describe("on failure", () => {
    const context = {
      deleteSetItemLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/user_interest - {"type": "error","message":"example message","detail":"example detail"}`
          )
        ),
    }

    it("returns a mutation error", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(res).toEqual({
        deleteOrderedSetItem: {
          deleteOrderedSetItemResponseOrError: {
            __typename: "deleteOrderedSetItemFailure",
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
