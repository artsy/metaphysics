import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    addOrderedSetItem(
      input: {
        id: "abc123"
        itemId: "xyz789"
        geminiToken: "vbn384"
        position: 1
      }
    ) {
      addOrderedSetItemResponseOrError {
        __typename
        ... on addOrderedSetItemSuccess {
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
        ... on addOrderedSetItemFailure {
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

describe("addOrderedSetItemMutation", () => {
  describe("on success", () => {
    const artist = {
      id: "asdf",
      name: "percy-z",
      hometown: "catville",
    }
    const set = {
      id: "fgh456",
      item_type: "Artist",
    }

    const mockAddSetItemLoader = jest.fn()
    const mockSetLoader = jest.fn()

    const context = {
      addSetItemLoader: mockAddSetItemLoader,
      setLoader: mockSetLoader,
    }

    beforeEach(() => {
      mockSetLoader.mockResolvedValue(Promise.resolve(set))
      mockAddSetItemLoader.mockResolvedValue(Promise.resolve(artist))
    })

    afterEach(() => {
      mockSetLoader.mockReset()
      mockAddSetItemLoader.mockReset()
    })

    it("returns the set and item", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(mockAddSetItemLoader).toBeCalledWith("abc123", {
        item_id: "xyz789",
        gemini_token: "vbn384",
        position: 1,
      })

      expect(res).toEqual({
        addOrderedSetItem: {
          addOrderedSetItemResponseOrError: {
            __typename: "addOrderedSetItemSuccess",
            setItem: {
              name: "percy-z",
              hometown: "catville",
            },
            set: {
              internalID: "fgh456",
              itemType: "Artist",
            },
          },
        },
      })
    })
  })

  describe("on failure", () => {
    const context = {
      addSetItemLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/user_interest - {"type": "error","message":"example message","detail":"example detail"}`
          )
        ),
    }

    it("returns a mutation error", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(res).toEqual({
        addOrderedSetItem: {
          addOrderedSetItemResponseOrError: {
            __typename: "addOrderedSetItemFailure",
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
