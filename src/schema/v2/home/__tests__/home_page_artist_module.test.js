/* eslint-disable promise/always-return */
import { graphql } from "graphql"
import { schema } from "schema/v2"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("HomePageArtistModule", () => {
  const query = key => {
    return `
      {
        homePage {
          artistModule(key: ${key}) {
            results {
              slug
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

  const context = {
    trendingArtistsLoader: () => Promise.resolve(trendingArtistData),
    popularArtistsLoader: () => Promise.resolve(popularArtistData),
    suggestedSimilarArtistsLoader: () => Promise.resolve(similarArtistData),
  }

  describe("when signed-in", () => {
    it("returns trending artists", () => {
      return runAuthenticatedQuery(query("TRENDING"), context).then(
        ({ homePage }) => {
          expect(homePage.artistModule.results).toEqual([{ slug: "trending" }])
        }
      )
    })

    it("returns trending artists", () => {
      return runAuthenticatedQuery(query("TRENDING"), context).then(
        ({ homePage }) => {
          expect(homePage.artistModule.results).toEqual([{ slug: "trending" }])
        }
      )
    })

    it("returns suggestions", () => {
      return runAuthenticatedQuery(query("SUGGESTED"), context).then(
        ({ homePage }) => {
          expect(homePage.artistModule.results).toEqual([{ slug: "suggested" }])
        }
      )
    })
  })

  describe("when signed-out", () => {
    it("returns trending artists", () => {
      return runAuthenticatedQuery(query("TRENDING"), context).then(
        ({ homePage }) => {
          expect(homePage.artistModule.results).toEqual([{ slug: "trending" }])
        }
      )
    })

    it("returns trending artists", () => {
      return runAuthenticatedQuery(query("TRENDING"), context).then(
        ({ homePage }) => {
          expect(homePage.artistModule.results).toEqual([{ slug: "trending" }])
        }
      )
    })

    it("does not return any suggestions", () => {
      return graphql(schema, query("SUGGESTED")).then(response => {
        expect(response.data.homePage.artistModule.results).toBe(null)
        expect(response.errors.length).toBeGreaterThan(0)
      })
    })
  })
})
