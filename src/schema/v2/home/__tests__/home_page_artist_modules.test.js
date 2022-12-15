/* eslint-disable promise/always-return */
import { map } from "lodash"
import { runQuery, runAuthenticatedQuery } from "schema/v2/test/utils"

describe("HomePageArtistModules", () => {
  let context = null
  const artists = [
    {
      id: "foo-bar",
      name: "Foo Bar",
      bio: null,
      blurb: null,
      birthday: null,
      artworks_count: 42,
    },
  ]

  const artistResultsWithData = {
    body: artists,
    headers: { "x-total-count": 1 },
  }
  const artistResultsWithoutData = { body: [], headers: { "x-total-count": 0 } }

  beforeEach(() => {
    context = {
      suggestedSimilarArtistsLoader: () =>
        Promise.resolve(artistResultsWithData),
      trendingArtistsLoader: () => Promise.resolve(artistResultsWithData),
      popularArtistsLoader: () => Promise.resolve(artistResultsWithData),
    }
  })

  describe("concerning display", () => {
    const query = `
      {
        homePage {
          artistModules {
            key
          }
        }
      }
    `

    describe("when signed-in", () => {
      it("shows all modules if there are any suggestions", () => {
        return runAuthenticatedQuery(query, context).then(({ homePage }) => {
          const keys = map(homePage.artistModules, "key")
          expect(keys).toEqual([
            "SUGGESTED",
            "CURATED_TRENDING",
            "TRENDING",
            "POPULAR",
          ])
        })
      })

      it("only shows the trending and popular artists modules if there are no suggestions", () => {
        context.suggestedSimilarArtistsLoader = () =>
          Promise.resolve(artistResultsWithoutData)
        return runAuthenticatedQuery(query, context).then(({ homePage }) => {
          const keys = map(homePage.artistModules, "key")
          expect(keys).toEqual(["CURATED_TRENDING", "TRENDING", "POPULAR"])
        })
      })
    })

    describe("when signed-out", () => {
      it("only shows the trending and popular artists modules", () => {
        delete context.suggestedSimilarArtistsLoader
        return runQuery(query, context).then(({ homePage }) => {
          const keys = map(homePage.artistModules, "key")
          expect(keys).toEqual(["CURATED_TRENDING", "TRENDING", "POPULAR"])
        })
      })
    })
  })
})
