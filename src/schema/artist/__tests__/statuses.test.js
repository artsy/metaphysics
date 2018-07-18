/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"

describe("Artist Statuses", () => {
  let artist = null
  let rootValue = null

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

    rootValue = {
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

    return runQuery(query, rootValue).then(data => {
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

    return runQuery(query, rootValue).then(data => {
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
