import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    deleteFeaturedLink(input: { id: "abc123" }) {
      featuredLinkOrError {
        __typename
        ... on DeleteFeaturedLinkSuccess {
          featuredLink {
            href
          }
        }
        ... on DeleteFeaturedLinkFailure {
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

describe("deleteFeaturedLinkMutation", () => {
  describe("on success", () => {
    const featuredLink = {
      href: "/percy",
      id: "abc123",
    }

    const mockDeleteFeaturedLinkLoader = jest.fn()

    const context = {
      deleteFeaturedLinkLoader: mockDeleteFeaturedLinkLoader,
    }

    beforeEach(() => {
      mockDeleteFeaturedLinkLoader.mockResolvedValue(
        Promise.resolve(featuredLink)
      )
    })

    afterEach(() => {
      mockDeleteFeaturedLinkLoader.mockReset()
    })

    it("returns the deleted featured link", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(mockDeleteFeaturedLinkLoader).toBeCalledWith("abc123")

      expect(res).toEqual({
        deleteFeaturedLink: {
          featuredLinkOrError: {
            __typename: "DeleteFeaturedLinkSuccess",
            featuredLink: {
              href: "/percy",
            },
          },
        },
      })
    })
  })

  describe("on failure", () => {
    const context = {
      deleteFeaturedLinkLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/featured_link - {"type": "error","message":"example message","detail":"example detail"}`
          )
        ),
    }

    it("returns a mutation error", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(res).toEqual({
        deleteFeaturedLink: {
          featuredLinkOrError: {
            __typename: "DeleteFeaturedLinkFailure",
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
