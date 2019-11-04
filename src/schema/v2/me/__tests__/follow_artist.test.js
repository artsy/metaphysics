/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

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
    const mutation = gql`
      mutation {
        followArtist(input: { artistID: "damon-zucconi" }) {
          artist {
            name
          }
          popularArtists {
            name
          }
        }
      }
    `

    const { followArtist } = await runAuthenticatedQuery(mutation, context)
    expect(followArtist).toEqual({
      artist: {
        name: "Damon Zucconi",
      },
      popularArtists: [
        { name: "Antonio Carreno" },
        { name: "Benjamin Schmit" },
      ],
    })
  })
})
