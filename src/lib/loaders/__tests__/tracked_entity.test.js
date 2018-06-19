/* eslint-disable promise/always-return */
import trackedEntityLoaderFactory from "lib/loaders/loaders_with_authentication/tracked_entity"

describe("trackedEntityLoader", () => {
  it("also works with payloads that don’t need an entity key path", () => {
    const gravityLoader = jest.fn(() =>
      Promise.resolve([{ id: "queens-ship" }])
    )
    const savedArtworksLoader = trackedEntityLoaderFactory(
      gravityLoader,
      "artworks",
      "is_saved"
    )
    return savedArtworksLoader("queens-ship").then(queens_ship => {
      expect(queens_ship.is_saved).toEqual(true)
      return savedArtworksLoader("kings-ship").then(kings_ship => {
        expect(kings_ship.is_saved).toEqual(false)
      })
    })
  })

  describe("with a entity key path", () => {
    let gravityLoader
    let followedArtistLoader

    beforeEach(() => {
      gravityLoader = jest.fn(() =>
        Promise.resolve([{ artist: { id: "cab", name: "Cab" } }])
      )
      followedArtistLoader = trackedEntityLoaderFactory(
        gravityLoader,
        "artists",
        "is_followed",
        "artist"
      )
    })

    it("passes the params to gravity and batches multiple requests", () => {
      return Promise.all([
        followedArtistLoader("cab"),
        followedArtistLoader("damon"),
      ]).then(() => {
        expect(gravityLoader.mock.calls[0][0]).toEqual({
          artists: ["cab", "damon"],
        })
      })
    })

    it("marks is_followed as true if artist is returned", () => {
      return followedArtistLoader("cab").then(artist => {
        expect(artist.is_followed).toBe(true)
      })
    })

    it("marks is_followed as false if artist is not returned", () => {
      return followedArtistLoader("damon").then(artist => {
        expect(artist.is_followed).toBe(false)
      })
    })
  })
})
