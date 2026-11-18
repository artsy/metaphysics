/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

describe("Artist Statuses", () => {
  let artist = null
  let context = null

  beforeEach(() => {
    artist = {
      id: "foo-bar",
      name: "Foo Bar",
      birthday: null,
      artworks_count: 42,
      partner_shows_count: 42,
      published_artworks_count: 42,
      displayable_partner_shows_count: 0,
    }

    context = {
      artistLoader: sinon.stub().returns(Promise.resolve(artist)),
      relatedMainArtistsLoader: () =>
        Promise.resolve({ headers: { "x-total-count": 3 } }),
    }
  })

  it("returns statuses for artworks, shows and cv", () => {
    const query = `
      {
        artist(id: "foo-bar") {
          statuses {
            artists
            artworks
            shows
            cv
          }
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data).toEqual({
        artist: {
          statuses: {
            artists: true,
            artworks: true,
            shows: false,
            cv: true,
          },
        },
      })
    })
  })

  it("resolves articles and biography statuses via the batched counts loader", () => {
    context.articleCountsLoader = ({ biography }) =>
      Promise.resolve(biography ? 0 : 2)
    const query = `
      {
        artist(id: "foo-bar") {
          statuses {
            articles
            biography
          }
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data.artist.statuses).toEqual({
        articles: true,
        biography: false,
      })
    })
  })

  it("allows an optional min show count arg for the CV status", () => {
    const query = `
      {
        artist(id: "foo-bar") {
          statuses {
            cv(minShowCount: 43)
          }
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data).toEqual({
        artist: {
          statuses: {
            cv: false,
          },
        },
      })
    })
  })
})
