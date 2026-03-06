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

    it("calls addSetItemLoader with orderedSetID and created link id when orderedSetID is provided", async () => {
      const mockAddSetItemLoader = jest.fn().mockResolvedValue(undefined)

      const mutationWithOrderedSet = gql`
        mutation {
          createFeaturedLink(
            input: {
              description: "link to cats"
              title: "Cat Link"
              href: "/percy"
              orderedSetID: "ordered-set-123"
            }
          ) {
            featuredLinkOrError {
              ... on CreateFeaturedLinkSuccess {
                featuredLink {
                  internalID
                  title
                }
              }
            }
          }
        }
      `

      const res = await runAuthenticatedQuery(mutationWithOrderedSet, {
        ...context,
        addSetItemLoader: mockAddSetItemLoader,
      })

      expect(mockAddSetItemLoader).toHaveBeenCalledWith("ordered-set-123", {
        item_id: "featured-link-id",
      })
      expect(
        res.createFeaturedLink.featuredLinkOrError.featuredLink
      ).toMatchObject({
        internalID: "featured-link-id",
        title: "Cat Link",
      })
    })
  })

  describe("orderedSetID without addSetItemLoader", () => {
    const featuredLink = {
      description: "link to cats",
      title: "Cat Link",
      href: "/percy",
      id: "featured-link-id",
    }

    it("throws when orderedSetID is provided but addSetItemLoader is not defined", async () => {
      const mutationWithOrderedSet = gql`
        mutation {
          createFeaturedLink(
            input: {
              description: "link to cats"
              title: "Cat Link"
              href: "/percy"
              orderedSetID: "ordered-set-123"
            }
          ) {
            featuredLinkOrError {
              ... on CreateFeaturedLinkSuccess {
                featuredLink {
                  internalID
                }
              }
            }
          }
        }
      `
      const contextWithoutAddSetItemLoader = {
        createFeaturedLinkLoader: jest.fn().mockResolvedValue(featuredLink),
        addSetItemLoader: undefined,
      }

      await expect(
        runAuthenticatedQuery(
          mutationWithOrderedSet,
          contextWithoutAddSetItemLoader
        )
      ).rejects.toThrow("addSetItemLoader is not defined")
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
