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
    }
  })

  it("returns statuses for artworks, shows and cv", () => {
    const query = `
      {
        artist(id: "foo-bar") {
          statuses {
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
            artworks: true,
            shows: false,
            cv: true,
          },
        },
      })
    })
  })
})
