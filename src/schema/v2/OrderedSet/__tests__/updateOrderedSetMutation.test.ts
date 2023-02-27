import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    updateOrderedSet(
      input: {
        description: "Example description"
        id: "xyz789"
        itemId: "abc123"
        itemType: "Artist"
        key: "a"
        layout: "default"
        name: "Example set"
        ownerId: "feature-id"
        ownerType: "Feature"
        published: true
      }
    ) {
      orderedSetOrError {
        __typename
        ... on UpdateOrderedSetSuccess {
          set {
            description
            itemType
            ownerType
            published
          }
        }
        ... on UpdateOrderedSetFailure {
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

describe("UpdateOrderedSetMutation", () => {
  describe("on success", () => {
    const set = {
      description: "Example description",
      id: "fgh456",
      item_type: "Artist",
      owner_type: "Feature",
      published: true,
    }

    const mockUpdateSetLoader = jest.fn()

    const context = {
      updateSetLoader: mockUpdateSetLoader,
    }

    beforeEach(() => {
      mockUpdateSetLoader.mockResolvedValue(Promise.resolve(set))
    })

    afterEach(() => {
      mockUpdateSetLoader.mockReset()
    })

    it("returns an Ordered Set", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(mockUpdateSetLoader).toBeCalledWith("xyz789", {
        description: "Example description",
        item_id: "abc123",
        item_type: "Artist",
        key: "a",
        layout: "default",
        name: "Example set",
        owner_id: "feature-id",
        owner_type: "Feature",
        published: true,
      })

      expect(res).toEqual({
        updateOrderedSet: {
          orderedSetOrError: {
            __typename: "UpdateOrderedSetSuccess",
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
      updateSetLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/user_interest - {"type": "error","message":"example message","detail":"example detail"}`
          )
        ),
    }

    it("returns a mutation error", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(res).toEqual({
        updateOrderedSet: {
          orderedSetOrError: {
            __typename: "UpdateOrderedSetFailure",
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
