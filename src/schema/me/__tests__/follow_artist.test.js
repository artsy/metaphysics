/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"

describe("FollowArtist", () => {
  let artist = null
  let rootValue = null

  beforeEach(() => {
    artist = {
      name: "Damon Zucconi",
      birthday: "1/1/1979",
      artworks_count: 100,
    }

    rootValue = {
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

  it("follows an artist", () => {
    const mutation = `
      mutation {
        followArtist(input: { artist_id: "damon-zucconi" }) {
          artist {
            name
          }
          popular_artists {
            artists {
              name
            }
          }
        }
      }
    `

    expect.assertions(1)
    return runAuthenticatedQuery(mutation, rootValue).then(
      ({ followArtist }) => {
        expect(followArtist).toEqual({
          artist: {
            name: "Damon Zucconi",
          },
          popular_artists: {
            artists: [{ name: "Antonio Carreno" }, { name: "Benjamin Schmit" }],
          },
        })
      }
    )
  })
})
