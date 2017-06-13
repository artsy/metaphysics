import savedArtwork from "lib/loaders/saved_artwork"

describe("savedArtwork", () => {
  afterEach(() => savedArtwork.__ResetDependency__("gravity"))

  it("loads the path and passes in the token", () => {
    const userID = "fake"
    const accessToken = "hello"
    const id = "cab"

    const gravity = sinon.stub().returns(
      Promise.resolve({
        body: [{ id: "cab", title: "Queen's Ship", artists: [] }],
      })
    )

    savedArtwork.__Rewire__("gravity", gravity)

    return savedArtwork.load(JSON.stringify({ id, userID, accessToken })).then(artwork => {
      expect(gravity.args[0][0]).toBe("collection/saved-artwork/artworks?artworks%5B%5D=cab&private=true&user_id=fake")
      expect(gravity.args[0][1]).toBe("hello")
      expect(artwork.is_saved).toBe(true)
    })
  })

  it("marks is_saved as false if artwork is not returned", () => {
    const userID = "fake"
    const accessToken = "hello"
    const id = "cab"

    const gravity = sinon.stub().returns(
      Promise.resolve({
        body: [],
      })
    )

    savedArtwork.__Rewire__("gravity", gravity)

    return savedArtwork.load(JSON.stringify({ id, userID, accessToken })).then(artwork => {
      expect(gravity.args[0][0]).toBe("collection/saved-artwork/artworks?artworks%5B%5D=cab&private=true&user_id=fake")
      expect(gravity.args[0][1]).toBe("hello")
      expect(artwork.is_saved).toBe(false)
    })
  })
})
