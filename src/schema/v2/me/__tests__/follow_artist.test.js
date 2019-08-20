/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("FollowArtist", () => {
  let artist = null
  let context = null

  beforeEach(() => {
    artist = {
      name: "Damon Zucconi",
      birthday: "1/1/1979",
      artworks_count: 100,
    }

    context = {
      artistLoader: sinon.stub().returns(Promise.resolve(artist)),
      popularArtistsLoader: () =>
        Promise.resolve([
          {
            birthday: "1900",
            artworks_count: 100,
            id: "antonio-carreno",
            name: "Antonio Carreno",
          },
          {
            birthday: "1900",
            artworks_count: 100,
            id: "benjamin-schmitt",
            name: "Benjamin Schmit",
          },
        ]),
      followArtistLoader: () => Promise.resolve(artist),
      unfollowArtistLoader: () => Promise.resolve(artist),
    }
  })

  it("follows an artist", async () => {
    const mutation = `
      mutation {
        followArtist(input: { artistID: "damon-zucconi" }) {
          artist {
            name
          }
          popularArtists {
            artists {
              name
            }
          }
        }
      }
    `

    await runAuthenticatedQuery(mutation, context).then(({ followArtist }) => {
      expect(followArtist).toEqual({
        artist: {
          name: "Damon Zucconi",
        },
        popularArtists: {
          artists: [{ name: "Antonio Carreno" }, { name: "Benjamin Schmit" }],
        },
      })
    })
    expect.assertions(1)
  })
})
