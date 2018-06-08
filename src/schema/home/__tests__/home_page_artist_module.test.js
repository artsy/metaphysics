/* eslint-disable promise/always-return */
import { graphql } from "graphql"
import schema from "schema"
import { runAuthenticatedQuery } from "test/utils"

describe("HomePageArtistModule", () => {
  const query = key => {
    return `
      {
        home_page {
          artist_module(key: ${key}) {
            results {
              id
            }
          }
        }
      }
    `
  }

  const trendingArtistData = [
    {
      id: "trending",
      birthday: null,
      artworks_count: null,
    },
  ]

  const popularArtistData = [
    {
      id: "popular",
      birthday: null,
      artworks_count: null,
    },
  ]

  const similarArtistData = {
    body: [
      {
        artist: {
          id: "suggested",
          birthday: null,
          artworks_count: null,
        },
      },
    ],
  }

  const rootValue = {
    trendingArtistsLoader: () => Promise.resolve(trendingArtistData),
    popularArtistsLoader: () => Promise.resolve(popularArtistData),
    suggestedSimilarArtistsLoader: () => Promise.resolve(similarArtistData),
  }

  describe("when signed-in", () => {
    it("returns trending artists", () => {
      return runAuthenticatedQuery(query("TRENDING"), rootValue).then(
        ({ home_page }) => {
          expect(home_page.artist_module.results).toEqual([{ id: "trending" }])
        }
      )
    })

    it("returns trending artists", () => {
      return runAuthenticatedQuery(query("TRENDING"), rootValue).then(
        ({ home_page }) => {
          expect(home_page.artist_module.results).toEqual([{ id: "trending" }])
        }
      )
    })

    it("returns suggestions", () => {
      return runAuthenticatedQuery(query("SUGGESTED"), rootValue).then(
        ({ home_page }) => {
          expect(home_page.artist_module.results).toEqual([{ id: "suggested" }])
        }
      )
    })
  })

  describe("when signed-out", () => {
    it("returns trending artists", () => {
      return runAuthenticatedQuery(query("TRENDING"), rootValue).then(
        ({ home_page }) => {
          expect(home_page.artist_module.results).toEqual([{ id: "trending" }])
        }
      )
    })

    it("returns trending artists", () => {
      return runAuthenticatedQuery(query("TRENDING"), rootValue).then(
        ({ home_page }) => {
          expect(home_page.artist_module.results).toEqual([{ id: "trending" }])
        }
      )
    })

    it("does not return any suggestions", () => {
      return graphql(schema, query("SUGGESTED")).then(response => {
        expect(response.data.home_page.artist_module.results).toBe(null)
        expect(response.errors.length).toBeGreaterThan(0)
      })
    })
  })
})
