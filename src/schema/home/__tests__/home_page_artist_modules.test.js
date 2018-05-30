import { map } from "lodash"
import { runQuery, runAuthenticatedQuery } from "test/utils"

describe("HomePageArtistModules", () => {
  let rootValue = null
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
    rootValue = {
      suggestedSimilarArtistsLoader: () =>
        {return Promise.resolve(artistResultsWithData)},
      trendingArtistsLoader: () => {return Promise.resolve(artistResultsWithData)},
      popularArtistsLoader: () => {return Promise.resolve(artistResultsWithData)},
    }
  })

  describe("concerning display", () => {
    const query = `
      {
        home_page {
          artist_modules {
            key
          }
        }
      }
    `

    describe("when signed-in", () => {
      it("shows all modules if there are any suggestions", () =>
        {return runAuthenticatedQuery(query, rootValue).then(({ home_page }) => {
          const keys = map(home_page.artist_modules, "key")
          expect(keys).toEqual(["SUGGESTED", "TRENDING", "POPULAR"])
        })})

      it("only shows the trending and popular artists modules if there are no suggestions", () => {
        rootValue.suggestedSimilarArtistsLoader = () =>
          {return Promise.resolve(artistResultsWithoutData)}
        return runAuthenticatedQuery(query, rootValue).then(({ home_page }) => {
          const keys = map(home_page.artist_modules, "key")
          expect(keys).toEqual(["TRENDING", "POPULAR"])
        })
      })
    })

    describe("when signed-out", () => {
      it("only shows the trending and popular artists modules", () => {
        delete rootValue.suggestedSimilarArtistsLoader
        return runQuery(query, rootValue).then(({ home_page }) => {
          const keys = map(home_page.artist_modules, "key")
          expect(keys).toEqual(["TRENDING", "POPULAR"])
        })
      })
    })
  })
})
