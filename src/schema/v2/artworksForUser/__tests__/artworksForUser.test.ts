import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import { extractNodes } from "lib/helpers"

const buildQuery = (args: any = {}) => {
  const first = args.first || 10
  const includeBackfill = args.includeBackfill || false
  const userId = args.userId || "abc123"

  const query = gql`
      {
        artworksForUser(first: ${first}, includeBackfill: ${includeBackfill}, userId: "${userId}") {
          edges {
            node {
              title
            }
          }
        }
      }
    `

  return query
}

const buildContext = (responses: any = {}) => {
  const {
    newForYouRecommendations,
    newForYouArtworks,
    sets,
    setItems,
    dislikedArtworks,
  } = responses
  const mockArtworksLoader = jest.fn(() => Promise.resolve(newForYouArtworks))
  const mockSetsLoader = jest.fn(() => Promise.resolve({ body: sets }))
  const mockSetItemsLoader = jest.fn(() => Promise.resolve({ body: setItems }))
  const mockVortexGraphqlLoader = jest.fn(() => () =>
    Promise.resolve({ data: { newForYouRecommendations } })
  )
  const mockCollectionArtworksLoader = jest.fn(() =>
    Promise.resolve({ body: dislikedArtworks })
  )

  const context = {
    artworksLoader: mockArtworksLoader,
    setsLoader: mockSetsLoader,
    setItemsLoader: mockSetItemsLoader,
    userID: "vortex-user-id",
    authenticatedLoaders: {
      vortexGraphqlLoader: mockVortexGraphqlLoader,
    },
    unauthenticatedLoaders: {
      vortexGraphqlLoader: null,
    },
    collectionArtworksLoader: mockCollectionArtworksLoader,
  } as any

  return context
}

describe("artworksForUser", () => {
  describe("with no artwork recommendations", () => {
    it("returns an empty array", async () => {
      const query = buildQuery()
      const affinities = []
      const context = buildContext({ affinities })

      const response = await runAuthenticatedQuery(query, context)
      expect(response.artworksForUser).not.toBeNull()

      const artworks = extractNodes(response.artworksForUser)
      expect(artworks.length).toEqual(0)
    })
  })

  describe("with no affinity artworks", () => {
    it("returns an empty array", async () => {
      const query = buildQuery()
      const newForYouRecommendations = [{}]
      const newForYouArtworks = []
      const context = buildContext({
        newForYouRecommendations,
        newForYouArtworks,
      })

      const { artworksForUser } = await runAuthenticatedQuery(query, context)
      const artworks = extractNodes(artworksForUser)
      expect(artworks.length).toEqual(0)
    })
  })

  describe("with recs and new for you artworks", () => {
    it("returns those artworks", async () => {
      const query = buildQuery()
      const newForYouRecommendations = {
        edges: [{ node: { artworkId: "valid-id" } }],
      }
      const newForYouArtworks = [{}]
      const context = buildContext({
        newForYouRecommendations,
        newForYouArtworks,
      })

      const { artworksForUser } = await runAuthenticatedQuery(query, context)
      const artworks = extractNodes(artworksForUser)
      expect(artworks.length).toEqual(1)
    })
  })

  describe("with backfill and no flag", () => {
    it("returns artworks without backfill", async () => {
      const query = buildQuery({ includeBackfill: false })
      const newForYouRecommendations = {
        edges: [{ node: { artworkId: "valid-id" } }],
      }
      const newForYouArtworks = [{}]
      const context = buildContext({
        newForYouRecommendations,
        newForYouArtworks,
      })

      const { artworksForUser } = await runAuthenticatedQuery(query, context)
      const artworks = extractNodes(artworksForUser)
      expect(artworks.length).toEqual(1)
    })
  })

  describe("with backfill and the flag but enough affinity artworks", () => {
    it("returns affinity artworks without backfill", async () => {
      const query = buildQuery({ first: 1, includeBackfill: true })
      const newForYouRecommendations = {
        edges: [{ node: { artworkId: "valid-id" } }],
      }
      const newForYouArtworks = [{}]
      const sets = [{ id: "valid-id" }]
      const setItems = [{}]
      const context = buildContext({
        newForYouRecommendations,
        newForYouArtworks,
        sets,
        setItems,
      })

      const { artworksForUser } = await runAuthenticatedQuery(query, context)
      const artworks = extractNodes(artworksForUser)
      expect(artworks.length).toEqual(1)
    })
  })

  describe("with backfill and the flag and not enough affinity artworks", () => {
    it("returns affinity artworks with backfill", async () => {
      const query = buildQuery({ first: 2, includeBackfill: true })
      const newForYouRecommendations = {
        edges: [{ node: { artworkId: "valid-id" } }],
      }
      const newForYouArtworks = [{}]
      const sets = [{ id: "valid-id" }]
      const setItems = [{}]
      const context = buildContext({
        newForYouRecommendations,
        newForYouArtworks,
        sets,
        setItems,
      })

      const { artworksForUser } = await runAuthenticatedQuery(query, context)
      const artworks = extractNodes(artworksForUser)
      expect(artworks.length).toEqual(2)
    })
  })

  describe("with no backfill and the flag and not enough affinity artworks", () => {
    it("returns only the affinity artworks", async () => {
      const query = buildQuery({ first: 2, includeBackfill: true })
      const newForYouRecommendations = {
        edges: [{ node: { artworkId: "valid-id" } }],
      }
      const newForYouArtworks = [{}]
      const context = buildContext({
        newForYouRecommendations,
        newForYouArtworks,
      })

      const { artworksForUser } = await runAuthenticatedQuery(query, context)
      const artworks = extractNodes(artworksForUser)
      expect(artworks.length).toEqual(1)
    })
  })

  describe("exclude disliked artworks", () => {
    // request 4 artworks, 2 of which are disliked
    // 2 artworks come from recommendations (1 disliked)
    // 2 come from backfill (1 disliked)
    it("exludes disliked artworks", async () => {
      const query = buildQuery({ first: 4, includeBackfill: true })

      const dislikedArtworks = [{ _id: "artwork-1" }, { _id: "artwork-3" }]
      const newForYouRecommendations = {
        edges: [
          { node: { artworkId: "artwork-1" } },
          { node: { artworkId: "artwork-2" } },
        ],
      }
      const newForYouArtworks = [
        { _id: "artwork-1", title: "artwork 1" },
        { _id: "artwork-2", title: "artwork 2" },
      ]
      const sets = [{ id: "artwork-backfill" }]
      const setItems = [
        { _id: "artwork-3", title: "artwork 3" },
        { _id: "artwork-4", title: "artwork 4" },
      ]

      const context = buildContext({
        newForYouRecommendations,
        newForYouArtworks,
        dislikedArtworks,
        sets,
        setItems,
      })

      const { artworksForUser } = await runAuthenticatedQuery(query, context)
      const artworks = extractNodes(artworksForUser)

      expect(artworks.length).toEqual(2)
      // not disliked artwork that comes from recommendations
      expect(artworks[0].title).toEqual("artwork 2")
      // not disliked artwork that comes from backfill
      expect(artworks[1].title).toEqual("artwork 4")
    })
  })
})
