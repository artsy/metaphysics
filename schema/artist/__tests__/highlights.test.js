import { runQuery } from "test/utils"

describe("Artist Statuses", () => {
  let rootValue = null
  const artist = {
    id: "percy-z",
    birthday: "2014",
    artworks_count: 420,
  }

  beforeEach(() => {
    rootValue = {
      partnerArtistsLoader: sinon.stub().returns(Promise.resolve([{ artist }])),
      artistLoader: sinon.stub().returns(Promise.resolve(artist)),
    }
  })

  it("returns partner artist highlights", () => {
    const query = `
      {
        artist(id: "foo-bar") {
          highlights {
            partner_artists {
              artist {
                id
              }
            }
          }
        }
      }
    `

    const expectedHighlightData = {
      artist: {
        highlights: {
          partner_artists: [
            {
              artist: {
                id: "percy-z",
              },
            },
          ],
        },
      },
    }

    return runQuery(query, rootValue).then(data => {
      expect(data).toEqual(expectedHighlightData)
    })
  })
})
