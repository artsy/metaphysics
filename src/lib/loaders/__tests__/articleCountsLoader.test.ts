import { createArticleCountsLoader } from "lib/loaders/articleCountsLoader"

describe("createArticleCountsLoader", () => {
  it("batches per-artist counts into one request and maps them back", async () => {
    const restLoader = jest.fn(async () => ({
      "artist-1": 3,
      "artist-2": 0,
    }))
    const loader = createArticleCountsLoader(restLoader)

    const [first, second] = await Promise.all([
      loader({ artistId: "artist-1" }),
      loader({ artistId: "artist-2" }),
    ])

    expect(first).toEqual(3)
    expect(second).toEqual(0)
    expect(restLoader).toHaveBeenCalledTimes(1)
    expect(restLoader).toHaveBeenCalledWith({
      artist_ids: ["artist-1", "artist-2"],
      published: true,
      in_editorial_feed: undefined,
      biography: undefined,
    })
  })

  it("zero-fills artists missing from the response", async () => {
    const restLoader = jest.fn(async () => ({ "artist-1": 5 }))
    const loader = createArticleCountsLoader(restLoader)

    expect(await loader({ artistId: "artist-2" })).toEqual(0)
  })

  it("splits editorial and non-editorial keys into separate requests", async () => {
    const restLoader = jest.fn(async ({ in_editorial_feed }) =>
      in_editorial_feed ? { "artist-1": 1 } : { "artist-1": 4 }
    )
    const loader = createArticleCountsLoader(restLoader)

    const [all, editorial] = await Promise.all([
      loader({ artistId: "artist-1" }),
      loader({ artistId: "artist-1", inEditorialFeed: true }),
    ])

    expect(all).toEqual(4)
    expect(editorial).toEqual(1)
    expect(restLoader).toHaveBeenCalledTimes(2)
  })

  it("deduplicates repeated artist ids within a request", async () => {
    const restLoader = jest.fn(async () => ({ "artist-1": 2 }))
    const loader = createArticleCountsLoader(restLoader)

    await Promise.all([
      loader({ artistId: "artist-1" }),
      loader({ artistId: "artist-1" }),
    ])

    expect(restLoader).toHaveBeenCalledTimes(1)
    expect(restLoader).toHaveBeenCalledWith({
      artist_ids: ["artist-1"],
      published: true,
      in_editorial_feed: undefined,
      biography: undefined,
    })
  })

  it("splits biography keys into a separate request", async () => {
    const restLoader = jest.fn(async ({ biography }) =>
      biography ? { "artist-1": 1 } : { "artist-1": 4 }
    )
    const loader = createArticleCountsLoader(restLoader)

    const [articles, biography] = await Promise.all([
      loader({ artistId: "artist-1" }),
      loader({ artistId: "artist-1", biography: true }),
    ])

    expect(articles).toEqual(4)
    expect(biography).toEqual(1)
    expect(restLoader).toHaveBeenCalledTimes(2)
    expect(restLoader).toHaveBeenCalledWith(
      expect.objectContaining({ biography: true })
    )
  })

  it("splits a batch larger than the max size across requests", async () => {
    const restLoader = jest.fn(async ({ artist_ids }) =>
      Object.fromEntries(artist_ids.map((id) => [id, 1]))
    )
    const loader = createArticleCountsLoader(restLoader)

    const results = await Promise.all(
      Array.from({ length: 150 }, (_x, i) => loader({ artistId: `a-${i}` }))
    )

    expect(results.every((c) => c === 1)).toBe(true)
    // 150 keys, max 100 per request → 2 requests
    expect(restLoader).toHaveBeenCalledTimes(2)
    expect(restLoader.mock.calls[0][0].artist_ids).toHaveLength(100)
    expect(restLoader.mock.calls[1][0].artist_ids).toHaveLength(50)
  })

  it("degrades to null for a key when the request fails", async () => {
    const restLoader = jest.fn(async () => {
      throw new Error("Positron down")
    })
    const loader = createArticleCountsLoader(restLoader)

    expect(await loader({ artistId: "artist-1" })).toBeNull()
  })
})
