import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    updateFeaturedLink(input: { href: "/percy", id: "xyz789" }) {
      featuredLinkOrError {
        __typename
        ... on UpdateFeaturedLinkSuccess {
          featuredLink {
            href
          }
        }
        ... on UpdateFeaturedLinkFailure {
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

describe("UpdateFeaturedLinkMutation", () => {
  describe("on success", () => {
    const featuredLink = {
      id: "xyz789",
      href: "/percy",
    }

    const mockUpdateFeaturedLinkLoader = jest.fn()

    const context = {
      updateFeaturedLinkLoader: mockUpdateFeaturedLinkLoader,
    }

    beforeEach(() => {
      mockUpdateFeaturedLinkLoader.mockResolvedValue(
        Promise.resolve(featuredLink)
      )
    })

    afterEach(() => {
      mockUpdateFeaturedLinkLoader.mockReset()
    })

    it("returns the updated featured link", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(mockUpdateFeaturedLinkLoader).toBeCalledWith("xyz789", {
        href: "/percy",
      })

      expect(res).toEqual({
        updateFeaturedLink: {
          featuredLinkOrError: {
            __typename: "UpdateFeaturedLinkSuccess",
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
      updateFeaturedLinkLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/featured_link - {"type": "error","message":"example message","detail":"example detail"}`
          )
        ),
    }

    it("returns a mutation error", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(res).toEqual({
        updateFeaturedLink: {
          featuredLinkOrError: {
            __typename: "UpdateFeaturedLinkFailure",
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
