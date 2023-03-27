import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    updatePage(
      input: {
        published: true
        content: "cool stuff"
        name: "Catty Page"
        id: "xyz789"
      }
    ) {
      pageOrError {
        __typename
        ... on UpdatePageSuccess {
          page {
            name
            published
          }
        }
        ... on UpdatePageFailure {
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

describe("UpdatePageMutation", () => {
  describe("on success", () => {
    const page = {
      id: "xyz789",
      name: "Catty Page",
      published: true,
    }

    const mockUpdatePageLoader = jest.fn()

    const context = {
      updatePageLoader: mockUpdatePageLoader,
    }

    beforeEach(() => {
      mockUpdatePageLoader.mockResolvedValue(Promise.resolve(page))
    })

    afterEach(() => {
      mockUpdatePageLoader.mockReset()
    })

    it("returns the updated page", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(mockUpdatePageLoader).toBeCalledWith("xyz789", {
        name: "Catty Page",
        published: true,
        content: "cool stuff",
      })

      expect(res).toEqual({
        updatePage: {
          pageOrError: {
            __typename: "UpdatePageSuccess",
            page: {
              name: "Catty Page",
              published: true,
            },
          },
        },
      })
    })
  })

  describe("on failure", () => {
    const context = {
      updatePageLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/page - {"type": "error","message":"example message","detail":"example detail"}`
          )
        ),
    }

    it("returns a mutation error", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(res).toEqual({
        updatePage: {
          pageOrError: {
            __typename: "UpdatePageFailure",
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
