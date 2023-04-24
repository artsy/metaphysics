import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import { extractNodes } from "lib/helpers"

const buildQuery = (args: any = {}) => {
  const first = args.first || 10
  const includeBackfill = args.includeBackfill || false
  const userId = args.userId || "abc123"
  const marketable = args.marketable || false

  const query = gql`
      {
        artworksForUser(first: ${first}, includeBackfill: ${includeBackfill}, userId: "${userId}", marketable: ${marketable}) {
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
    newForYouMarketableArtworks,
    sets,
    setItems,
  } = responses
  const mockArtworksLoader = jest.fn(() => Promise.resolve(newForYouArtworks))
  const mockSetsLoader = jest.fn(() => Promise.resolve({ body: sets }))
  const mockSetItemsLoader = jest.fn(() => Promise.resolve({ body: setItems }))
  const mockVortexGraphqlLoader = jest.fn(() => () =>
    Promise.resolve({ data: { newForYouRecommendations } })
  )
  const mockFilterArtworksLoader = jest.fn(() =>
    Promise.resolve({ hits: newForYouMarketableArtworks })
  )

  const context = {
    artworksLoader: mockArtworksLoader,
    setsLoader: mockSetsLoader,
    setItemsLoader: mockSetItemsLoader,
    vortexGraphqlLoader: mockVortexGraphqlLoader,
    filterArtworksLoader: mockFilterArtworksLoader,
  }

  return context
}

describe("artworksForUser", () => {
  describe("with no artworksLoader", () => {
    it("returns null", async () => {
      const query = buildQuery()
      const context = {
        ...buildContext(),
        artworksLoader: undefined,
      }

      const response = await runAuthenticatedQuery(query, context)
      expect(response.artworksForUser).toBeNull()
    })
  })

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

  describe("marketable", () => {
    it("doesn't filter marketable artworks when marketable is false", async () => {
      const query = buildQuery({
        first: 2,
        includeBackfill: true,
        marketable: false,
      })
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

    it("filters for marketable artworks when marketable is true", async () => {
      const query = buildQuery({
        first: 5,
        includeBackfill: false,
        marketable: true,
      })

      const allArtworks = [
        { node: { _id: "valid-marketabke-id-1", title: "artwork-1" } },
        { node: { _id: "valid-marketable-id-2", title: "artwork-2" } },
        { node: { _id: "valid-non-marketabke-id-1", title: "artwork-3" } },
      ]

      const newForYouRecommendations = {
        edges: allArtworks,
      }

      const newForYouArtworks = allArtworks.map((a) => a.node)

      const newForYouMarketableArtworks = [
        allArtworks[0].node,
        allArtworks[1].node,
      ]

      const context = buildContext({
        newForYouRecommendations,
        newForYouArtworks,
        newForYouMarketableArtworks,
      })

      const { artworksForUser } = await runAuthenticatedQuery(query, context)
      const artworks = extractNodes(artworksForUser)
      expect(artworks).toEqual([
        {
          title: "artwork-1",
        },
        {
          title: "artwork-2",
        },
      ])
    })
  })
})
