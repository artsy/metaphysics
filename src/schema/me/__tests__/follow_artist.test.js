import schema from "schema"
import { runAuthenticatedQuery } from "test/utils"

describe("FollowArtist", () => {
  const gravity = sinon.stub()
  const FollowArtist = schema.__get__("FollowArtist")

  let artist = null
  let rootValue = null

  beforeEach(() => {
    gravity.with = sinon.stub().returns(gravity)

    FollowArtist.__Rewire__("gravity", gravity)

    artist = {
      name: "Damon Zucconi",
      birthday: "1/1/1979",
      artworks_count: 100,
    }

    rootValue = {
      artistLoader: sinon.stub().returns(Promise.resolve(artist)),
    }
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

    gravity.returns(Promise.resolve(artist))

    expect.assertions(1)
    return runAuthenticatedQuery(mutation, rootValue).then(({ followArtist }) => {
      expect(followArtist).toEqual({
        artist: {
          name: "Damon Zucconi",
        },
      })
    })
  })
})
