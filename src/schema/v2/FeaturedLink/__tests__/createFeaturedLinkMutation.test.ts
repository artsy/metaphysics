import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    createFeaturedLink(
      input: { description: "link to cats", title: "Cat Link", href: "/percy" }
    ) {
      featuredLinkOrError {
        __typename
        ... on CreateFeaturedLinkSuccess {
          featuredLink {
            description
            title
            href
          }
        }
        ... on CreateFeaturedLinkFailure {
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

describe("CreateFeaturedLinkMutation", () => {
  describe("on success", () => {
    const featuredLink = {
      description: "link to cats",
      title: "Cat Link",
      href: "/percy",
      id: "featured-link-id",
    }

    const mockCreateFeaturedLinkLoader = jest.fn()

    const context = {
      createFeaturedLinkLoader: mockCreateFeaturedLinkLoader,
    }

    beforeEach(() => {
      mockCreateFeaturedLinkLoader.mockResolvedValue(
        Promise.resolve(featuredLink)
      )
    })

    afterEach(() => {
      mockCreateFeaturedLinkLoader.mockReset()
    })

    it("returns a featuredLink", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(mockCreateFeaturedLinkLoader).toBeCalledWith({
        description: "link to cats",
        title: "Cat Link",
        href: "/percy",
      })

      expect(res).toEqual({
        createFeaturedLink: {
          featuredLinkOrError: {
            __typename: "CreateFeaturedLinkSuccess",
            featuredLink: {
              description: "link to cats",
              title: "Cat Link",
              href: "/percy",
            },
          },
        },
      })
    })
  })

  describe("on failure", () => {
    const context = {
      createFeaturedLinkLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/featured_link - {"type": "error","message":"example message","detail":"example detail"}`
          )
        ),
    }

    it("returns a mutation error", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(res).toEqual({
        createFeaturedLink: {
          featuredLinkOrError: {
            __typename: "CreateFeaturedLinkFailure",
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
