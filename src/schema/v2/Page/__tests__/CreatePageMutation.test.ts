import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    createPage(
      input: { name: "Catty Page", published: true, content: "cool stuff" }
    ) {
      pageOrError {
        __typename
        ... on CreatePageSuccess {
          page {
            name
            published
          }
        }
        ... on CreatePageFailure {
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

describe("CreatePageMutation", () => {
  describe("on success", () => {
    const page = {
      name: "Catty Page",
      published: true,
      id: "page-id",
    }

    const mockCreatePageLoader = jest.fn()

    const context = {
      createPageLoader: mockCreatePageLoader,
    }

    beforeEach(() => {
      mockCreatePageLoader.mockResolvedValue(Promise.resolve(page))
    })

    afterEach(() => {
      mockCreatePageLoader.mockReset()
    })

    it("returns a page", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(mockCreatePageLoader).toBeCalledWith({
        name: "Catty Page",
        published: true,
        content: "cool stuff",
      })

      expect(res).toEqual({
        createPage: {
          pageOrError: {
            __typename: "CreatePageSuccess",
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
      createPageLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/page - {"type": "error","message":"example message","detail":"example detail"}`
          )
        ),
    }

    it("returns a mutation error", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(res).toEqual({
        createPage: {
          pageOrError: {
            __typename: "CreatePageFailure",
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
