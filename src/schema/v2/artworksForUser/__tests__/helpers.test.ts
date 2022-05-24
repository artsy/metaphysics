import {
  getBackfillArtworks,
  getNewForYouArtworks,
  getNewForYouRecs,
} from "../helpers"

const mockLoaderFactory = (affinities) => {
  const edges = affinities.map((affinity) => {
    return { node: { ...affinity } }
  })

  const data = { newForYouRecommendations: { edges } }
  const loader = jest.fn(() => ({ data }))

  return loader
}

describe("getNewForYouRecs", () => {
  const userLoader = mockLoaderFactory([{ artworkId: "banksy" }])
  const appLoader = mockLoaderFactory([{ artworkId: "warhol" }])

  it("prefers the user loader when available", async () => {
    const context = {
      vortexGraphqlLoader: () => userLoader,
      vortexGraphqlLoaderFactory: () => () => appLoader,
    } as any

    const artworkIds = await getNewForYouRecs({}, context)

    expect(artworkIds).toEqual(["banksy"])
  })

  it("falls back to the app loader when there is no user loader", async () => {
    const context = {
      vortexGraphqlLoader: null,
      vortexGraphqlLoaderFactory: () => () => appLoader,
    } as any

    const artworkIds = await getNewForYouRecs({}, context)

    expect(artworkIds).toEqual(["warhol"])
  })
})

describe("getNewForYouArtworks", () => {
  it("returns an empty array with empty artwork ids", async () => {
    const artworkIds = []
    const gravityArgs = {}
    const context = {} as any

    const artworks = await getNewForYouArtworks(
      artworkIds,
      gravityArgs,
      context
    )
    expect(artworks).toEqual([])
  })

  it("returns artworks for those artwork ids", async () => {
    const artworkIds = ["banksy"]
    const gravityArgs = {}
    const mockArtworksLoader = jest.fn(() => [{}])
    const context = {
      artworksLoader: mockArtworksLoader,
    } as any

    const artworks = await getNewForYouArtworks(
      artworkIds,
      gravityArgs,
      context
    )
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
