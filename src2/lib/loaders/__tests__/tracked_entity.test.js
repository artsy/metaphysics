/* eslint-disable promise/always-return */
import trackedEntityLoaderFactory from "lib/loaders/loaders_with_authentication/tracked_entity"

describe("trackedEntityLoader", () => {
  it("also works with payloads that don’t need an entity key path", async () => {
    const gravityLoader = jest.fn(() =>
      Promise.resolve([{ id: "queens-ship" }])
    )
    const savedArtworksLoader = trackedEntityLoaderFactory(gravityLoader, {
      paramKey: "artworks",
      trackingKey: "is_saved",
    })
    const queens_ship = await savedArtworksLoader("queens-ship")
    expect(queens_ship.is_saved).toEqual(true)
    const kings_ship = await savedArtworksLoader("kings-ship")
    expect(kings_ship.is_saved).toEqual(false)
  })

  describe("with a entity key path", () => {
    let gravityLoader
    let followedArtistLoader

    beforeEach(() => {
      gravityLoader = jest.fn(() =>
        Promise.resolve([{ artist: { id: "cab", name: "Cab" } }])
      )
      followedArtistLoader = trackedEntityLoaderFactory(gravityLoader, {
        paramKey: "artists",
        trackingKey: "is_followed",
        entityKeyPath: "artist",
      })
    })

    it("passes the params to gravity and batches multiple requests", async () => {
      await Promise.all([
        followedArtistLoader("cab"),
        followedArtistLoader("damon"),
      ])
      expect(gravityLoader.mock.calls[0][0]).toEqual({
        artists: ["cab", "damon"],
      })
    })

    it("marks is_followed as true if artist is returned", async () => {
      const artist = await followedArtistLoader("cab")
      expect(artist.is_followed).toBe(true)
    })

    it("marks is_followed as false if artist is not returned", async () => {
      const artist = await followedArtistLoader("damon")
      expect(artist.is_followed).toBe(false)
    })
  })
  it("marks is_followed as true for custom ID key paths", async () => {
    const gravityLoader = jest
      .fn()
      .mockResolvedValue([{ id: "queens-ship", _id: "abcdefg123456" }])

    const savedArtworksLoader = trackedEntityLoaderFactory(gravityLoader, {
      paramKey: "artworks",
      trackingKey: "is_saved",
      entityIDKeyPath: "_id",
    })
    const queens_ship = await savedArtworksLoader("abcdefg123456")
    expect(queens_ship.is_saved).toEqual(true)
    const kings_ship = await savedArtworksLoader("zyxwvut987654")
    expect(kings_ship.is_saved).toEqual(false)
  })
})
