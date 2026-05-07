/* eslint-disable promise/always-return */
import { graphql } from "graphql"
import { schema } from "schema/v2"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("HomePageArtistModule", () => {
  const query = (key) => {
    return `
      {
        homePage {
          artistModule(key: ${key}) {
            results {
              slug
              basedOn {
                slug
              }
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
        sim_artist: {
          id: "similar",
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
          expect(homePage.artistModule.results[0].slug).toEqual("trending")
        }
      )
    })

    it("returns popular artists", () => {
      return runAuthenticatedQuery(query("POPULAR"), context).then(
        ({ homePage }) => {
          expect(homePage.artistModule.results[0].slug).toEqual("popular")
        }
      )
    })

    it("returns suggestions", () => {
      return runAuthenticatedQuery(query("SUGGESTED"), context).then(
        ({ homePage }) => {
          expect(homePage.artistModule.results[0].slug).toEqual("suggested")
          expect(homePage.artistModule.results[0].basedOn.slug).toEqual(
            "similar"
          )
        }
      )
    })
  })

  describe("when signed-out", () => {
    it("returns trending artists", () => {
      return runAuthenticatedQuery(query("TRENDING"), context).then(
        ({ homePage }) => {
          expect(homePage.artistModule.results[0].slug).toEqual("trending")
        }
      )
    })

    it("returns popular artists", () => {
      return runAuthenticatedQuery(query("POPULAR"), context).then(
        ({ homePage }) => {
          expect(homePage.artistModule.results[0].slug).toEqual("popular")
        }
      )
    })

    it("does not return any suggestions", () => {
      return graphql(schema, query("SUGGESTED")).then((response) => {
        expect(response.data.homePage.artistModule.results).toBe(null)
        expect(response.errors.length).toBeGreaterThan(0)
      })
    })
  })
})
