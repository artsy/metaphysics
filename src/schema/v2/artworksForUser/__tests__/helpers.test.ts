import {
  getAffinityArtworks,
  getArtistAffinities,
  getBackfillArtworks,
} from "../helpers"

const mockLoaderFactory = (affinities) => {
  const edges = affinities.map((affinity) => {
    return { node: { ...affinity } }
  })

  const data = { artistAffinities: { edges } }
  const loader = jest.fn(() => ({ data }))

  return loader
}

describe("getArtistAffinities", () => {
  const userLoader = mockLoaderFactory([{ artistId: "banksy", score: "7.77" }])
  const appLoader = mockLoaderFactory([{ artistId: "warhol", score: "9.99" }])

  it("prefers the user loader when available", async () => {
    const context = {
      vortexGraphqlLoader: () => userLoader,
      vortexGraphqlLoaderFactory: () => () => appLoader,
    } as any

    const artistIds = await getArtistAffinities({}, context)

    expect(artistIds).toEqual(["banksy"])
  })

  it("falls back to the app loader when there is no user loader", async () => {
    const context = {
      vortexGraphqlLoader: null,
      vortexGraphqlLoaderFactory: () => () => appLoader,
    } as any

    const artistIds = await getArtistAffinities({}, context)

    expect(artistIds).toEqual(["warhol"])
  })
})

describe("getAffinityArtworks", () => {
  it("returns an empty array with empty artist ids", async () => {
    const artistIds = []
    const gravityArgs = {}
    const context = {} as any

    const artworks = await getAffinityArtworks(artistIds, gravityArgs, context)
    expect(artworks).toEqual([])
  })

  it("returns recently published artworks for those artist ids", async () => {
    const artistIds = ["banksy"]
    const gravityArgs = {}
    const mockArtworksLoader = jest.fn(() => [{}])
    const context = {
      artworksLoader: mockArtworksLoader,
    } as any

    const artworks = await getAffinityArtworks(artistIds, gravityArgs, context)
    expect(artworks.length).toEqual(1)
  })
})

describe("getBackfillArtworks", () => {
  it("returns an empty array without the backfill flag", async () => {
    const remainingSize = 6
    const includeBackfill = false
    const context = {} as any

    const backfillArtworks = await getBackfillArtworks(
      remainingSize,
      includeBackfill,
      context
    )

    expect(backfillArtworks).toEqual([])
  })

  it("returns an empty array with zero remaining size", async () => {
    const remainingSize = 0
    const includeBackfill = true
    const context = {} as any

    const backfillArtworks = await getBackfillArtworks(
      remainingSize,
      includeBackfill,
      context
    )

    expect(backfillArtworks).toEqual([])
  })

  it("returns an empty array with no backfill id", async () => {
    const mockSetsLoader = jest.fn(() => ({ body: [] }))
    const remainingSize = 6
    const includeBackfill = false
    const context = {
      setsLoader: mockSetsLoader,
    } as any

    const backfillArtworks = await getBackfillArtworks(
      remainingSize,
      includeBackfill,
      context
    )

    expect(backfillArtworks).toEqual([])
  })

  it("returns backfill with a remaining size", async () => {
    const mockSetsLoader = jest.fn(() => ({ body: [{ id: "valid_id" }] }))
    const mockSetItemsLoader = jest.fn(() => ({ body: [{}] }))
    const remainingSize = 1
    const includeBackfill = true
    const context = {
      setsLoader: mockSetsLoader,
      setItemsLoader: mockSetItemsLoader,
    } as any

    const backfillArtworks = await getBackfillArtworks(
      remainingSize,
      includeBackfill,
      context
    )

    expect(backfillArtworks.length).toEqual(1)
  })

  it("returns no more backfill than the remaining size asks for", async () => {
    const mockSetsLoader = jest.fn(() => ({ body: [{ id: "valid_id" }] }))
    const mockSetItemsLoader = jest.fn(() => ({ body: [{}, {}] }))
    const remainingSize = 1
    const includeBackfill = true
    const context = {
      setsLoader: mockSetsLoader,
      setItemsLoader: mockSetItemsLoader,
    } as any

    const backfillArtworks = await getBackfillArtworks(
      remainingSize,
      includeBackfill,
      context
    )

    expect(backfillArtworks.length).toEqual(1)
  })
})
