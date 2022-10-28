import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import { extractNodes } from "lib/helpers"

const buildQuery = (args: any = {}) => {
  const first = args.first || 10
  const includeBackfill = args.includeBackfill || false
  const userId = args.userId || "abc123"

  const query = gql`
      {
        artistsForUser(first: ${first}, includeBackfill: ${includeBackfill}, userId: "${userId}") {
          edges {
            node {
              id
            }
          }
        }
      }
    `

  return query
}

const buildContext = (responses: any = {}) => {
  const {
    artistRecommendations,
    getArtistRecommendations,
    sets,
    setItems,
  } = responses
  const mockArtistsLoader = jest.fn(() =>
    Promise.resolve(getArtistRecommendations)
  )
  const mockSetsLoader = jest.fn(() => Promise.resolve({ body: sets }))
  const mockSetItemsLoader = jest.fn(() => Promise.resolve({ body: setItems }))
  const mockVortexGraphqlLoader = jest.fn(() => () =>
    Promise.resolve({ data: { artistRecommendations } })
  )

  const context = {
    artistsLoader: mockArtistsLoader,
    setsLoader: mockSetsLoader,
    setItemsLoader: mockSetItemsLoader,
    vortexGraphqlLoader: mockVortexGraphqlLoader,
  }

  return context
}

describe("artistsForUser", () => {
  describe("with no artistsLoader", () => {
    it("returns null", async () => {
      const query = buildQuery()
      const context = {
        ...buildContext(),
        artistsLoader: undefined,
      }

      const response = await runAuthenticatedQuery(query, context)
      expect(response.artistsForUser).toBeNull()
    })
  })

  describe("with no artist recommendations", () => {
    it("returns an empty array", async () => {
      const query = buildQuery()
      const artistRecommendations = []
      const context = buildContext({ artistRecommendations })

      const response = await runAuthenticatedQuery(query, context)
      expect(response.artistsForUser).not.toBeNull()

      const artists = extractNodes(response.artistsForUser)
      expect(artists.length).toEqual(0)
    })
  })

  describe("with artist recommendations", () => {
    it("returns those artists", async () => {
      const query = buildQuery()
      const artistRecommendations = {
        edges: [{ node: { id: "valid-id" } }],
      }
      const context = buildContext({
        artistRecommendations,
      })

      const { artistsForUser } = await runAuthenticatedQuery(query, context)
      const artists = extractNodes(artistsForUser)
      expect(artists.length).toEqual(1)
    })
  })

  describe("with backfill and no flag", () => {
    it("returns artists without backfill", async () => {
      const query = buildQuery({ includeBackfill: false })
      const newForYouRecommendations = {
        edges: [{ node: { id: "valid-id" } }],
      }
      const artistRecommendations = [{}]
      const context = buildContext({
        artistRecommendations,
      })

      const { artistsForUser } = await runAuthenticatedQuery(query, context)
      const artists = extractNodes(artistsForUser)
      expect(artists.length).toEqual(1)
    })
  })

  describe("with backfill and the flag but enough artist recommendations", () => {
    it("returns artist recommendations without backfill", async () => {
      const query = buildQuery({ first: 1, includeBackfill: true })
      const artistRecommendations = {
        edges: [{ node: { id: "valid-id" } }],
      }
      const sets = [{ id: "valid-id" }]
      const setItems = [{}]
      const context = buildContext({
        artistRecommendations,
        sets,
        setItems,
      })

      const { artistsForUser } = await runAuthenticatedQuery(query, context)
      const artists = extractNodes(artistsForUser)
      expect(artists.length).toEqual(1)
    })
  })

  describe("with backfill and the flag and not enough artist recommendations", () => {
    it("returns artist recommendations with backfill", async () => {
      const query = buildQuery({ first: 2, includeBackfill: true })
      const artistRecommendations = {
        edges: [{ node: { id: "valid-id" } }],
      }
      const sets = [{ id: "valid-id2" }]
      const setItems = [{}]
      const context = buildContext({
        artistRecommendations,
        sets,
        setItems,
      })

      const { artistsForUser } = await runAuthenticatedQuery(query, context)
      const artists = extractNodes(artistsForUser)
      expect(artists.length).toEqual(2)
    })
  })
})
