import { graphql } from "graphql"
import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

const ARTIST_IDS = Array.from(
  { length: 10 },
  (_, index) => `artist-${index + 1}`
)
const ARTWORK_IDS = Array.from(
  { length: 8 },
  (_, index) => `artwork-${index + 1}`
)

const rail = (entityIDs: string[]) =>
  entityIDs.map((entity_id, index) => ({ entity_id, rank: index + 1 }))

const window = ({ artists = ARTIST_IDS, artworks = ARTWORK_IDS } = {}) => ({
  data: {
    period: "1d",
    artists: rail(artists),
    artworks: rail(artworks),
  },
})

describe("searchDropdown", () => {
  // Responses come back reversed, so ordering assertions can't pass by luck.
  const artistsLoader = jest.fn(({ ids }) =>
    Promise.resolve({
      body: ids
        .map((id) => ({
          _id: id,
          id: `slug-${id}`,
          name: `Artist ${id}`,
          cover_artwork_id: `cover-${id}`,
        }))
        .reverse(),
      headers: {},
    })
  )

  const artworksLoader = jest.fn(({ ids }) =>
    Promise.resolve(
      ids.map((id) => ({ _id: id, title: `Artwork ${id}` })).reverse()
    )
  )

  const trendingSearchesLoader = jest.fn((_params: any) =>
    Promise.resolve(window())
  )

  const contextWith = (
    { unauthenticatedLoaders = {}, ...overrides } = {} as any
  ) => ({
    artistsLoader,
    artworksLoader,
    ...overrides,
    unauthenticatedLoaders: {
      trendingSearchesLoader,
      ...unauthenticatedLoaders,
    },
  })

  const context = contextWith()

  beforeEach(() => {
    artistsLoader.mockClear()
    artworksLoader.mockClear()
    trendingSearchesLoader.mockClear()
  })

  describe("trending", () => {
    it("defaults to the one day window", async () => {
      const query = gql`
        {
          searchDropdown {
            trending {
              period
              label
            }
          }
        }
      `

      const { searchDropdown } = await runQuery(query, context)

      expect(searchDropdown.trending).toEqual({
        period: "ONE_DAY",
        label: "Today",
      })

      expect(trendingSearchesLoader).toHaveBeenCalledWith({ period: "1d" })
    })

    it("asks Vortex for the requested window", async () => {
      const query = gql`
        {
          searchDropdown {
            trending(period: THIRTY_DAYS) {
              period
              label
            }
          }
        }
      `

      const { searchDropdown } = await runQuery(query, context)

      expect(searchDropdown.trending.period).toEqual("THIRTY_DAYS")
      expect(searchDropdown.trending.label).toEqual("Past 30 Days")
      expect(trendingSearchesLoader).toHaveBeenCalledWith({ period: "30d" })
    })

    it("serves a signed in visitor the same rails as a logged out one", async () => {
      const query = gql`
        {
          searchDropdown {
            trending {
              artists {
                internalID
              }
            }
          }
        }
      `

      // The ranking isn't personalized, so it reads through the unauthenticated
      // loaders either way — present for every request, with or without a user.
      const loggedOut = await runQuery(
        query,
        contextWith({ authenticatedLoaders: {} })
      )
      const signedIn = await runQuery(
        query,
        contextWith({ authenticatedLoaders: { meLoader: jest.fn() } })
      )

      expect(loggedOut).toEqual(signedIn)
      expect(
        loggedOut.searchDropdown.trending.artists.map(
          ({ internalID }) => internalID
        )
      ).toEqual(ARTIST_IDS)
    })

    it("only admits periods the enum knows about", async () => {
      const query = gql`
        {
          searchDropdown {
            trending(period: SOME_OTHER_WINDOW) {
              period
            }
          }
        }
      `

      // Rejected by validation, before any resolver runs.
      await expect(runQuery(query, context)).rejects.toThrow()
      expect(trendingSearchesLoader).not.toHaveBeenCalled()
    })

    it("reports empty rails when Vortex has no ranking", async () => {
      const emptyLoader = jest.fn(() =>
        Promise.resolve(window({ artists: [], artworks: [] }))
      )

      const { searchDropdown } = await runQuery(
        gql`
          {
            searchDropdown {
              trending {
                artists {
                  rank
                }
                artworks {
                  rank
                }
              }
            }
          }
        `,
        contextWith({
          unauthenticatedLoaders: { trendingSearchesLoader: emptyLoader },
        })
      )

      expect(searchDropdown.trending).toEqual({
        artists: [],
        artworks: [],
      })
      // Nothing to hydrate, so Gravity is never called.
      expect(artistsLoader).not.toHaveBeenCalled()
      expect(artworksLoader).not.toHaveBeenCalled()
    })

    it("nulls trending rather than the query when Vortex fails", async () => {
      const { schema } = require("schema/v2")

      const result = await graphql({
        schema,
        source: gql`
          {
            searchDropdown {
              trending {
                period
              }
            }
          }
        `,
        contextValue: contextWith({
          unauthenticatedLoaders: {
            trendingSearchesLoader: jest.fn(() =>
              Promise.reject(new Error("Vortex is down"))
            ),
          },
          requestIDs: { requestID: "123456789", xForwardedFor: "123.456.789" },
        }),
      })

      expect(result.errors?.[0].message).toEqual("Vortex is down")
      expect((result.data as any).searchDropdown.trending).toBeNull()
    })
  })

  describe("hydration", () => {
    const query = gql`
      {
        searchDropdown {
          trending(period: SEVEN_DAYS) {
            artists {
              rank
              internalID
              artist {
                name
              }
            }
            artworks {
              rank
              internalID
              artwork {
                title
              }
            }
          }
        }
      }
    `

    it("hydrates each rail with a single loader call", async () => {
      await runQuery(query, context)

      expect(artistsLoader).toHaveBeenCalledTimes(1)
      expect(artworksLoader).toHaveBeenCalledTimes(1)

      // size is explicit so Gravity's default page can't truncate the rail.
      expect(artistsLoader).toHaveBeenCalledWith({
        ids: ARTIST_IDS,
        size: ARTIST_IDS.length,
      })
      expect(artworksLoader).toHaveBeenCalledWith({
        ids: ARTWORK_IDS,
        size: ARTWORK_IDS.length,
      })
    })

    it("fetches both rails in one Vortex call", async () => {
      await runQuery(query, context)

      expect(trendingSearchesLoader).toHaveBeenCalledTimes(1)
    })

    it("preserves rank order regardless of the order Gravity returns", async () => {
      const {
        searchDropdown: { trending },
      } = await runQuery(query, context)

      expect(trending.artists.map(({ internalID }) => internalID)).toEqual(
        ARTIST_IDS
      )
      expect(trending.artworks.map(({ internalID }) => internalID)).toEqual(
        ARTWORK_IDS
      )
    })

    it("attaches each record to its own entry", async () => {
      const {
        searchDropdown: { trending },
      } = await runQuery(query, context)

      trending.artists.forEach(({ internalID, artist }) => {
        expect(artist.name).toEqual(`Artist ${internalID}`)
      })
      trending.artworks.forEach(({ internalID, artwork }) => {
        expect(artwork.title).toEqual(`Artwork ${internalID}`)
      })
    })

    it("drops entries Gravity did not return rather than leaving holes", async () => {
      const [dropped, ...kept] = ARTIST_IDS

      const partialLoader = jest.fn(({ ids }) =>
        Promise.resolve({
          body: ids.filter((id) => id !== dropped).map((id) => ({ _id: id })),
          headers: {},
        })
      )

      const {
        searchDropdown: { trending },
      } = await runQuery(query, contextWith({ artistsLoader: partialLoader }))

      expect(trending.artists).toHaveLength(kept.length)
      expect(
        trending.artists.map(({ internalID }) => internalID)
      ).not.toContain(dropped)
      expect(trending.artists.every(({ artist }) => artist !== null)).toBe(true)

      // Rank is assigned after the drop, so there's no gap.
      expect(trending.artists.map(({ rank }) => rank)).toEqual(
        kept.map((_, index) => index + 1)
      )
    })

    it("ranks entries by the order Vortex published", async () => {
      const {
        searchDropdown: { trending },
      } = await runQuery(query, context)

      expect(trending.artists.map(({ rank }) => rank)).toEqual(
        ARTIST_IDS.map((_, index) => index + 1)
      )
      expect(trending.artworks.map(({ rank }) => rank)).toEqual(
        ARTWORK_IDS.map((_, index) => index + 1)
      )
    })

    it("nulls only the failing rail when a loader rejects", async () => {
      // runQuery discards partial data on error; go direct to see both halves.
      const { schema } = require("schema/v2")

      const result = await graphql({
        schema,
        source: query,
        contextValue: contextWith({
          artistsLoader: jest.fn(() =>
            Promise.reject(new Error("Gravity is down"))
          ),
          requestIDs: { requestID: "123456789", xForwardedFor: "123.456.789" },
        }),
      })

      expect(result.errors?.[0].message).toEqual("Gravity is down")

      const trending = (result.data as any).searchDropdown.trending
      expect(trending.artists).toBeNull()
      expect(trending.artworks.length).toBeGreaterThan(0)
    })
  })

  describe("first", () => {
    const firstQuery = gql`
      {
        searchDropdown {
          trending(period: SEVEN_DAYS) {
            artists(first: 7) {
              rank
            }
            artworks(first: 5) {
              rank
            }
          }
        }
      }
    `

    it("returns only the top n entries", async () => {
      const {
        searchDropdown: { trending },
      } = await runQuery(firstQuery, context)

      expect(trending.artists.map(({ rank }) => rank)).toEqual([
        1,
        2,
        3,
        4,
        5,
        6,
        7,
      ])
      expect(trending.artworks.map(({ rank }) => rank)).toEqual([1, 2, 3, 4, 5])
    })

    it("truncates before hydrating, so the rows are never fetched", async () => {
      await runQuery(firstQuery, context)

      expect(artistsLoader.mock.calls[0][0].ids).toHaveLength(7)
      expect(artworksLoader.mock.calls[0][0].ids).toHaveLength(5)
    })
  })

  describe("cover artworks", () => {
    const coverQuery = gql`
      {
        searchDropdown {
          trending(period: SEVEN_DAYS) {
            artists(first: 3) {
              artist {
                coverArtwork {
                  title
                }
              }
            }
          }
        }
      }
    `

    it("fetches every artist's cover artwork in one call", async () => {
      const artworkLoader = jest.fn()

      const {
        searchDropdown: { trending },
      } = await runQuery(
        coverQuery,
        contextWith({ unauthenticatedLoaders: { artworkLoader } })
      )

      // The per-artist path this batching exists to avoid.
      expect(artworkLoader).not.toHaveBeenCalled()

      const coverIDs = ARTIST_IDS.slice(0, 3).map((id) => `cover-${id}`)

      expect(artworksLoader).toHaveBeenCalledWith({
        ids: coverIDs,
        size: coverIDs.length,
      })

      trending.artists.forEach(({ artist }) => {
        expect(artist.coverArtwork.title).toMatch(/^Artwork cover-/)
      })
    })

    it("does not fetch them when the client didn't ask", async () => {
      await runQuery(
        gql`
          {
            searchDropdown {
              trending(period: SEVEN_DAYS) {
                artists(first: 3) {
                  artist {
                    name
                  }
                }
              }
            }
          }
        `,
        context
      )

      expect(artistsLoader).toHaveBeenCalledTimes(1)
      expect(artworksLoader).not.toHaveBeenCalled()
    })

    it("falls back to the per-artist path when the cover artwork is gone", async () => {
      // Gravity omits unpublished artworks from a batch response.
      const emptyArtworksLoader = jest.fn(() => Promise.resolve([]))
      const artworkLoader = jest.fn(() =>
        Promise.resolve({ title: "Fallback artwork" })
      )

      const {
        searchDropdown: { trending },
      } = await runQuery(
        coverQuery,
        contextWith({
          artworksLoader: emptyArtworksLoader,
          unauthenticatedLoaders: { artworkLoader },
        })
      )

      expect(artworkLoader).toHaveBeenCalledTimes(3)
      trending.artists.forEach(({ artist }) => {
        expect(artist.coverArtwork.title).toEqual("Fallback artwork")
      })
    })

    it("keeps the rail when the cover artwork batch fails outright", async () => {
      const failingArtworksLoader = jest.fn(() =>
        Promise.reject(new Error("Gravity is down"))
      )
      const artworkLoader = jest.fn(() =>
        Promise.resolve({ title: "Fallback artwork" })
      )

      const {
        searchDropdown: { trending },
      } = await runQuery(
        coverQuery,
        contextWith({
          artworksLoader: failingArtworksLoader,
          unauthenticatedLoaders: { artworkLoader },
        })
      )

      // Images are secondary — the artists themselves already loaded.
      expect(trending.artists).toHaveLength(3)
      trending.artists.forEach(({ artist }) => {
        expect(artist.coverArtwork.title).toEqual("Fallback artwork")
      })
    })
  })
})
