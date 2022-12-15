import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    createOrderedSet(
      input: {
        description: "Example description"
        itemId: "abc123"
        itemType: "Artist"
        key: "a"
        layout: "default"
        name: "Example set"
        ownerType: "Feature"
        published: true
      }
    ) {
      orderedSetOrError {
        __typename
        ... on createOrderedSetSuccess {
          set {
            description
            itemType
            ownerType
            published
          }
        }
        ... on createOrderedSetFailure {
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

describe("createOrderedSetMutation", () => {
  describe("on success", () => {
    const set = {
      description: "Example description",
      id: "fgh456",
      item_type: "Artist",
      owner_type: "Feature",
      published: true,
    }

    const mockCreateSetLoader = jest.fn()

    const context = {
      createSetLoader: mockCreateSetLoader,
    }

    beforeEach(() => {
      mockCreateSetLoader.mockResolvedValue(Promise.resolve(set))
    })

    afterEach(() => {
      mockCreateSetLoader.mockReset()
    })

    it("returns a Artist", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(mockCreateSetLoader).toBeCalledWith({
        description: "Example description",
        item_id: "abc123",
        item_type: "Artist",
        key: "a",
        layout: "default",
        name: "Example set",
        owner_type: "Feature",
        published: true,
      })

      expect(res).toEqual({
        createOrderedSet: {
          orderedSetOrError: {
            __typename: "createOrderedSetSuccess",
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
      createSetLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/user_interest - {"type": "error","message":"example message","detail":"example detail"}`
          )
        ),
    }

    it("returns a mutation error", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(res).toEqual({
        createOrderedSet: {
          orderedSetOrError: {
            __typename: "createOrderedSetFailure",
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
