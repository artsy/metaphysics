import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

const artworks = [
  { _id: "art-1", title: "Artwork One" },
  { _id: "art-2", title: "Artwork Two" },
]

const baseContext: Partial<ResolverContext> = {
  meLoader: () => Promise.resolve({ id: "some-user-id" }),
  collectionLoader: () =>
    Promise.resolve({
      name: "saved-artwork",
      private: true,
      description: "Some collection",
      default: true,
    }),
}

describe("me.followsAndSaves.artworksConnection", () => {
  it("returns artworks for a collection", async () => {
    const query = gql`
      {
        me {
          followsAndSaves {
            artworksConnection(first: 10) {
              edges {
                node {
                  title
                }
              }
            }
          }
        }
      }
    `

    const context: Partial<ResolverContext> = {
      ...baseContext,
      collectionArtworksLoader: () =>
        Promise.resolve({
          body: artworks,
          headers: { "x-total-count": "2" },
        }),
    }

    const data = await runAuthenticatedQuery(query, context)
    const edges = data.me.followsAndSaves.artworksConnection.edges

    expect(edges).toHaveLength(2)
    expect(edges[0].node.title).toBe("Artwork One")
  })

  it("returns totalCount when requested", async () => {
    const query = gql`
      {
        me {
          followsAndSaves {
            artworksConnection(first: 10) {
              totalCount
              edges {
                node {
                  title
                }
              }
            }
          }
        }
      }
    `

    const context: Partial<ResolverContext> = {
      ...baseContext,
      collectionArtworksLoader: () =>
        Promise.resolve({
          body: artworks,
          headers: { "x-total-count": "25" },
        }),
    }

    const data = await runAuthenticatedQuery(query, context)
    expect(data.me.followsAndSaves.artworksConnection.totalCount).toBe(25)
  })

  describe("with ENABLE_LAZY_TOTAL_COUNT", () => {
    let originalConfig

    beforeEach(() => {
      originalConfig = require("config").default
      require("config").default = {
        ...originalConfig,
        ENABLE_LAZY_TOTAL_COUNT: true,
      }
    })

    afterEach(() => {
      require("config").default = originalConfig
    })

    it("skips total_count when client does not request totalCount", async () => {
      const query = gql`
        {
          me {
            followsAndSaves {
              artworksConnection(first: 10) {
                edges {
                  node {
                    title
                  }
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
          }
        }
      `

      const loader = jest.fn().mockResolvedValue({
        body: artworks,
        headers: {},
      })

      const context: Partial<ResolverContext> = {
        ...baseContext,
        collectionArtworksLoader: loader,
      }

      const data = await runAuthenticatedQuery(query, context)
      const connection = data.me.followsAndSaves.artworksConnection

      expect(connection.edges).toHaveLength(2)
      expect(connection.pageInfo.hasNextPage).toBe(false)

      // Verify total_count was NOT sent to Gravity
      const gravityOptions = loader.mock.calls[0][1]
      expect(gravityOptions.total_count).toBe(false)
    })

    it("sends total_count when client requests totalCount", async () => {
      const query = gql`
        {
          me {
            followsAndSaves {
              artworksConnection(first: 10) {
                totalCount
                edges {
                  node {
                    title
                  }
                }
              }
            }
          }
        }
      `

      const loader = jest.fn().mockResolvedValue({
        body: artworks,
        headers: { "x-total-count": "25" },
      })

      const context: Partial<ResolverContext> = {
        ...baseContext,
        collectionArtworksLoader: loader,
      }

      const data = await runAuthenticatedQuery(query, context)

      expect(data.me.followsAndSaves.artworksConnection.totalCount).toBe(25)

      // Verify total_count WAS sent to Gravity
      const gravityOptions = loader.mock.calls[0][1]
      expect(gravityOptions.total_count).toBe(true)
    })

    it("sends total_count when client requests pageCursors", async () => {
      const query = gql`
        {
          me {
            followsAndSaves {
              artworksConnection(first: 10) {
                pageCursors {
                  around {
                    cursor
                    page
                    isCurrent
                  }
                }
                edges {
                  node {
                    title
                  }
                }
              }
            }
          }
        }
      `

      const loader = jest.fn().mockResolvedValue({
        body: artworks,
        headers: { "x-total-count": "25" },
      })

      const context: Partial<ResolverContext> = {
        ...baseContext,
        collectionArtworksLoader: loader,
      }

      await runAuthenticatedQuery(query, context)

      // Verify total_count WAS sent to Gravity
      const gravityOptions = loader.mock.calls[0][1]
      expect(gravityOptions.total_count).toBe(true)
    })

    it("infers hasNextPage from full page without count", async () => {
      const query = gql`
        {
          me {
            followsAndSaves {
              artworksConnection(first: 2) {
                edges {
                  node {
                    title
                  }
                }
                pageInfo {
                  hasNextPage
                }
              }
            }
          }
        }
      `

      const context: Partial<ResolverContext> = {
        ...baseContext,
        collectionArtworksLoader: () =>
          Promise.resolve({
            body: artworks, // 2 items, matches first: 2
            headers: {},
          }),
      }

      const data = await runAuthenticatedQuery(query, context)
      expect(
        data.me.followsAndSaves.artworksConnection.pageInfo.hasNextPage
      ).toBe(true)
    })

    it("infers hasNextPage as false from partial page", async () => {
      const query = gql`
        {
          me {
            followsAndSaves {
              artworksConnection(first: 10) {
                edges {
                  node {
                    title
                  }
                }
                pageInfo {
                  hasNextPage
                }
              }
            }
          }
        }
      `

      const context: Partial<ResolverContext> = {
        ...baseContext,
        collectionArtworksLoader: () =>
          Promise.resolve({
            body: artworks, // 2 items, less than first: 10
            headers: {},
          }),
      }

      const data = await runAuthenticatedQuery(query, context)
      expect(
        data.me.followsAndSaves.artworksConnection.pageInfo.hasNextPage
      ).toBe(false)
    })
  })
})
