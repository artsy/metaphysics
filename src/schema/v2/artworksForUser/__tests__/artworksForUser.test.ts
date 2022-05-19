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
  const { artistAffinities, affinityArtworks, sets, setItems } = responses
  const mockArtworksLoader = jest.fn(() => Promise.resolve(affinityArtworks))
  const mockSetsLoader = jest.fn(() => Promise.resolve({ body: sets }))
  const mockSetItemsLoader = jest.fn(() => Promise.resolve({ body: setItems }))
  const mockVortexGraphqlLoader = jest.fn(() => () =>
    Promise.resolve({ data: { artistAffinities } })
  )

  const context = {
    artworksLoader: mockArtworksLoader,
    setsLoader: mockSetsLoader,
    setItemsLoader: mockSetItemsLoader,
    vortexGraphqlLoader: mockVortexGraphqlLoader,
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

  describe("with no artist affinities", () => {
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
      const artistAffinities = [{}]
      const affinityArtworks = []
      const context = buildContext({ artistAffinities, affinityArtworks })

      const { artworksForUser } = await runAuthenticatedQuery(query, context)
      const artworks = extractNodes(artworksForUser)
      expect(artworks.length).toEqual(0)
    })
  })

  describe("with artist affinities and affinity artworks", () => {
    it("returns those artworks", async () => {
      const query = buildQuery()
      const artistAffinities = { edges: [{ node: { artistId: "valid-id" } }] }
      const affinityArtworks = [{}]
      const context = buildContext({ artistAffinities, affinityArtworks })

      const { artworksForUser } = await runAuthenticatedQuery(query, context)
      const artworks = extractNodes(artworksForUser)
      expect(artworks.length).toEqual(1)
    })
  })

  describe("with backfill and no flag", () => {
    it("returns affinity artworks without backfill", async () => {
      const query = buildQuery({ includeBackfill: false })
      const artistAffinities = { edges: [{ node: { artistId: "valid-id" } }] }
      const affinityArtworks = [{}]
      const context = buildContext({ artistAffinities, affinityArtworks })

      const { artworksForUser } = await runAuthenticatedQuery(query, context)
      const artworks = extractNodes(artworksForUser)
      expect(artworks.length).toEqual(1)
    })
  })

  describe("with backfill and the flag but enough affinity artworks", () => {
    it("returns affinity artworks without backfill", async () => {
      const query = buildQuery({ first: 1, includeBackfill: true })
      const artistAffinities = { edges: [{ node: { artistId: "valid-id" } }] }
      const affinityArtworks = [{}]
      const sets = [{ id: "valid-id" }]
      const setItems = [{}]
      const context = buildContext({
        artistAffinities,
        affinityArtworks,
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
      const artistAffinities = { edges: [{ node: { artistId: "valid-id" } }] }
      const affinityArtworks = [{}]
      const sets = [{ id: "valid-id" }]
      const setItems = [{}]
      const context = buildContext({
        artistAffinities,
        affinityArtworks,
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
      const artistAffinities = { edges: [{ node: { artistId: "valid-id" } }] }
      const affinityArtworks = [{}]
      const context = buildContext({ artistAffinities, affinityArtworks })

      const { artworksForUser } = await runAuthenticatedQuery(query, context)
      const artworks = extractNodes(artworksForUser)
      expect(artworks.length).toEqual(1)
    })
  })
})
