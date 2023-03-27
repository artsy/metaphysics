import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    deletePage(input: { id: "abc123" }) {
      pageOrError {
        __typename
        ... on DeletePageSuccess {
          page {
            name
            published
          }
        }
        ... on DeletePageFailure {
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

describe("deletePageMutation", () => {
  describe("on success", () => {
    const page = {
      name: "Catty Feature",
      id: "abc123",
      published: true,
    }

    const mockDeletePageLoader = jest.fn()

    const context = {
      deletePageLoader: mockDeletePageLoader,
    }

    beforeEach(() => {
      mockDeletePageLoader.mockResolvedValue(Promise.resolve(page))
    })

    afterEach(() => {
      mockDeletePageLoader.mockReset()
    })

    it("returns the deleted feature", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(mockDeletePageLoader).toBeCalledWith("abc123")

      expect(res).toEqual({
        deletePage: {
          pageOrError: {
            __typename: "DeletePageSuccess",
            page: {
              name: "Catty Feature",
              published: true,
            },
          },
        },
      })
    })
  })

  describe("on failure", () => {
    const context = {
      deletePageLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/page - {"type": "error","message":"example message","detail":"example detail"}`
          )
        ),
    }

    it("returns a mutation error", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(res).toEqual({
        deletePage: {
          pageOrError: {
            __typename: "DeletePageFailure",
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
