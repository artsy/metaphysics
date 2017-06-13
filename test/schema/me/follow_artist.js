import schema from "schema"
import { runAuthenticatedQuery } from "test/utils"

describe("FollowArtist", () => {
  const gravity = sinon.stub()
  const FollowArtist = schema.__get__("FollowArtist")

  beforeEach(() => {
    gravity.with = sinon.stub().returns(gravity)

    FollowArtist.__Rewire__("gravity", gravity)
  })

  afterEach(() => {
    FollowArtist.__ResetDependency__("gravity")
  })

  it("follows an artist", () => {
    const mutation = `
      mutation {
        followArtist(input: { artist_id: "damon-zucconi" }) {
          artist {
            name
          }
        }
      }
    `

    const artist = {
      name: "Damon Zucconi",
      birthday: "1/1/1979",
      artworks_count: 100,
    }

    const expectedArtistData = {
      artist: {
        name: "Damon Zucconi",
      },
    }

    gravity.returns(Promise.resolve(artist))

    return runAuthenticatedQuery(mutation).then(({ followArtist }) => {
      expect(followArtist).toEqual(expectedArtistData)
    })
  })
})
