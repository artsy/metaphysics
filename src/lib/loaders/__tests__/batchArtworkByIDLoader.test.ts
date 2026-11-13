import { createArtworkByIDLoader } from "../batchArtworkByIDLoader"

describe("createArtworkByIDLoader", () => {
  it("coalesces loads in the same tick into one batched /artworks call", async () => {
    const artworksLoader = jest.fn(({ ids }) =>
      Promise.resolve(ids.map((id: string) => ({ _id: id })))
    )
    const loader = createArtworkByIDLoader(artworksLoader)

    const result = await Promise.all([
      loader.load("a1"),
      loader.load("a2"),
      loader.load("a3"),
    ])

    expect(artworksLoader).toHaveBeenCalledTimes(1)
    expect(artworksLoader).toHaveBeenCalledWith({
      ids: ["a1", "a2", "a3"],
      batched: true,
      size: 3,
    })
    expect(result).toEqual([{ _id: "a1" }, { _id: "a2" }, { _id: "a3" }])
  })

  it("passes size = batch length so Gravity doesn't paginate id lookups to 10", async () => {
    // Simulate Gravity: fetching by id still paginates, defaulting to 10 unless
    // an explicit size is passed.
    const artworksLoader = jest.fn(({ ids, size }) =>
      Promise.resolve(
        ids.slice(0, size ?? 10).map((id: string) => ({ _id: id }))
      )
    )
    const loader = createArtworkByIDLoader(artworksLoader)

    const ids = Array.from({ length: 12 }, (_, i) => `a${i}`)
    const result = await Promise.all(ids.map((id) => loader.load(id)))

    expect(artworksLoader).toHaveBeenCalledWith(
      expect.objectContaining({ size: 12 })
    )
    // All 12 resolve — none silently dropped by the default page of 10.
    expect(result.filter(Boolean)).toHaveLength(12)
  })

  it("maps results back by _id regardless of response order", async () => {
    const artworksLoader = jest.fn(({ ids }) =>
      Promise.resolve([...ids].reverse().map((id: string) => ({ _id: id })))
    )
    const loader = createArtworkByIDLoader(artworksLoader)

    const result = await Promise.all([loader.load("a1"), loader.load("a2")])

    expect(result).toEqual([{ _id: "a1" }, { _id: "a2" }])
  })

  it("returns null for ids the endpoint omits", async () => {
    const artworksLoader = jest.fn(() => Promise.resolve([{ _id: "a1" }]))
    const loader = createArtworkByIDLoader(artworksLoader)

    const result = await Promise.all([
      loader.load("a1"),
      loader.load("missing"),
    ])

    expect(result).toEqual([{ _id: "a1" }, null])
  })

  it("degrades to nulls (never rejects) when the load fails", async () => {
    const artworksLoader = jest.fn().mockRejectedValue(new Error("boom"))
    const loader = createArtworkByIDLoader(artworksLoader)

    const result = await Promise.all([loader.load("a1"), loader.load("a2")])

    expect(result).toEqual([null, null])
  })
})
