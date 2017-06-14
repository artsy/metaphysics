import followedArtist from "lib/loaders/followed_artist"

describe("followedArtist", () => {
  afterEach(() => followedArtist.__ResetDependency__("gravity"))

  it("loads the path and passes in the token", () => {
    const accessToken = "hello"
    const id = "cab"

    const gravity = sinon.stub().returns(
      Promise.resolve({
        body: [{ artist: { id: "cab", name: "Cab" } }],
      })
    )

    followedArtist.__Rewire__("gravity", gravity)

    return followedArtist.load(JSON.stringify({ id, accessToken })).then(artist => {
      expect(gravity.args[0][0]).toBe("me/follow/artists?artists%5B%5D=cab")
      expect(gravity.args[0][1]).toBe("hello")
      expect(artist.is_followed).toBe(true)
    })
  })

  it("marks is_followed as false if artist is not returned", () => {
    const accessToken = "hello"
    const id = "cab"

    const gravity = sinon.stub().returns(
      Promise.resolve({
        body: [],
      })
    )

    followedArtist.__Rewire__("gravity", gravity)

    return followedArtist.load(JSON.stringify({ id, accessToken })).then(artist => {
      expect(gravity.args[0][0]).toBe("me/follow/artists?artists%5B%5D=cab")
      expect(gravity.args[0][1]).toBe("hello")
      expect(artist.is_followed).toBe(false)
    })
  })
})
