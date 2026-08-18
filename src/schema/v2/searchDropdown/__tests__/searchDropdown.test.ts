import { graphql } from "graphql"
import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import trendingSearches from "data/trendingSearches.json"
import { trendingWindowFor } from "../trendingData"

const windowFor = (period: string) =>
  trendingSearches.windows.find((window) => window.period === period)!

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

  const context = { artistsLoader, artworksLoader }

  beforeEach(() => {
    artistsLoader.mockClear()
    artworksLoader.mockClear()
  })

  describe("trending", () => {
    it("defaults to the one day window", async () => {
      const query = gql`
        {
          searchDropdown {
            trending {
              period
              label
              asOf
            }
          }
        }
      `

      const { searchDropdown } = await runQuery(query, context)

      expect(searchDropdown.trending).toEqual({
        period: "ONE_DAY",
        label: "Today",
        asOf: trendingSearches.asOf,
      })
    })

    it("returns the requested window", async () => {
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
    })

    it("throws if the enum and the fixture drift apart", () => {
      // Unreachable through the schema, so test the lookup directly.
      expect(() => trendingWindowFor("90d")).toThrow(
        "No trending data for period: 90d"
      )
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

      const { artistIDs, artworkIDs } = windowFor("7d")

      // size is explicit so Gravity's default page can't truncate the rail.
      expect(artistsLoader).toHaveBeenCalledWith({
        ids: artistIDs,
        size: artistIDs.length,
      })
      expect(artworksLoader).toHaveBeenCalledWith({
        ids: artworkIDs,
        size: artworkIDs.length,
      })
    })

    it("preserves rank order regardless of the order Gravity returns", async () => {
      const {
        searchDropdown: { trending },
      } = await runQuery(query, context)

      expect(trending.artists.map(({ internalID }) => internalID)).toEqual(
        windowFor("7d").artistIDs
      )
      expect(trending.artworks.map(({ internalID }) => internalID)).toEqual(
        windowFor("7d").artworkIDs
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
      const [dropped, ...kept] = windowFor("7d").artistIDs

      const partialLoader = jest.fn(({ ids }) =>
        Promise.resolve({
          body: ids.filter((id) => id !== dropped).map((id) => ({ _id: id })),
          headers: {},
        })
      )

      const {
        searchDropdown: { trending },
      } = await runQuery(query, { ...context, artistsLoader: partialLoader })

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

    it("ranks entries by their position in the fixture", async () => {
      const {
        searchDropdown: { trending },
      } = await runQuery(query, context)

      expect(trending.artists.map(({ rank }) => rank)).toEqual(
        windowFor("7d").artistIDs.map((_, index) => index + 1)
      )
      expect(trending.artworks.map(({ rank }) => rank)).toEqual(
        windowFor("7d").artworkIDs.map((_, index) => index + 1)
      )
    })

    it("nulls only the failing rail when a loader rejects", async () => {
      // runQuery discards partial data on error; go direct to see both halves.
      const { schema } = require("schema/v2")

      const result = await graphql({
        schema,
        source: query,
        contextValue: {
          ...context,
          artistsLoader: jest.fn(() =>
            Promise.reject(new Error("Gravity is down"))
          ),
          requestIDs: { requestID: "123456789", xForwardedFor: "123.456.789" },
        },
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
      } = await runQuery(coverQuery, {
        ...context,
        unauthenticatedLoaders: { artworkLoader },
      })

      // The per-artist path this batching exists to avoid.
      expect(artworkLoader).not.toHaveBeenCalled()

      const coverIDs = windowFor("7d")
        .artistIDs.slice(0, 3)
        .map((id) => `cover-${id}`)

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
      } = await runQuery(coverQuery, {
        ...context,
        artworksLoader: emptyArtworksLoader,
        unauthenticatedLoaders: { artworkLoader },
      })

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
      } = await runQuery(coverQuery, {
        ...context,
        artworksLoader: failingArtworksLoader,
        unauthenticatedLoaders: { artworkLoader },
      })

      // Images are secondary — the artists themselves already loaded.
      expect(trending.artists).toHaveLength(3)
      trending.artists.forEach(({ artist }) => {
        expect(artist.coverArtwork.title).toEqual("Fallback artwork")
      })
    })
  })
})
