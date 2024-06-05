import {
  getBackfillArtworks,
  getNewForYouArtworks,
  getNewForYouArtworkIDs,
} from "../helpers"

const mockLoaderFactory = (affinities) => {
  const edges = affinities.map((affinity) => {
    return { node: { ...affinity } }
  })

  const data = { newForYouRecommendations: { edges } }
  const loader = jest.fn(() => ({ data }))

  return loader
}

describe("getNewForYouArtworkIDs", () => {
  const userLoader = mockLoaderFactory([{ artworkId: "banksy" }])
  const appLoader = mockLoaderFactory([{ artworkId: "warhol" }])

  it("prefers the authenticatedLoaders when available", async () => {
    const context = {
      authenticatedLoaders: {
        vortexGraphqlLoader: () => userLoader,
      },
      unauthenticatedLoaders: {
        vortexGraphqlLoader: appLoader,
      },
    } as any

    const artworkIds = await getNewForYouArtworkIDs(
      { excludeArtworkIds: [] },
      context
    )

    expect(artworkIds).toEqual(["banksy"])
  })
})

describe("getNewForYouArtworks", () => {
  it("returns an empty array with empty artwork ids", async () => {
    const artworkIds = []
    const gravityArgs = {}
    const context = {} as any

    const artworks = await getNewForYouArtworks(
      { ids: artworkIds },
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
      { ids: artworkIds },
      gravityArgs,
      context
    )
    expect(artworks.length).toEqual(1)
    expect(mockArtworksLoader).toBeCalledWith({
      availability: "for sale",
      exclude_disliked_artworks: false,
      ids: artworkIds,
    })
  })

  it("passes exclude_disliked_artworks parameter to Gravity artworksLoader", async () => {
    const artworkIds = ["banksy"]
    const gravityArgs = {}
    const mockArtworksLoader = jest.fn(() => [{}])
    const context = {
      artworksLoader: mockArtworksLoader,
    } as any

    await getNewForYouArtworks(
      { ids: artworkIds, excludeDislikedArtworks: true },
      gravityArgs,
      context
    )
    expect(mockArtworksLoader).toBeCalledWith({
      availability: "for sale",
      exclude_disliked_artworks: true,
      ids: artworkIds,
    })
  })
})

describe("getBackfillArtworks", () => {
  it("returns an empty array without the backfill flag", async () => {
    const size = 6
    const includeBackfill = false
    const context = {} as any

    const backfillArtworks = await getBackfillArtworks(
      size,
      includeBackfill,
      context
    )

    expect(backfillArtworks).toEqual([])
  })

  it("returns an empty array with zero remaining size", async () => {
    const size = 0
    const includeBackfill = true
    const context = {} as any

    const backfillArtworks = await getBackfillArtworks(
      size,
      includeBackfill,
      context
    )

    expect(backfillArtworks).toEqual([])
  })

  it("returns an empty array with no backfill id", async () => {
    const mockSetsLoader = jest.fn(() => ({ body: [] }))
    const size = 6
    const includeBackfill = false
    const context = {
      setsLoader: mockSetsLoader,
    } as any

    const backfillArtworks = await getBackfillArtworks(
      size,
      includeBackfill,
      context
    )

    expect(backfillArtworks).toEqual([])
  })

  it("returns backfill with a remaining size", async () => {
    const mockSetsLoader = jest.fn(() => ({ body: [{ id: "valid_id" }] }))
    const mockSetItemsLoader = jest.fn(() => ({ body: [{}] }))
    const size = 1
    const includeBackfill = true
    const context = {
      setsLoader: mockSetsLoader,
      setItemsLoader: mockSetItemsLoader,
      authenticatedLoaders: {},
      unauthenticatedLoaders: {},
    } as any

    const backfillArtworks = await getBackfillArtworks(
      size,
      includeBackfill,
      context
    )

    expect(mockSetItemsLoader).toBeCalledWith("valid_id", {
      exclude_disliked_artworks: false,
    })
    expect(backfillArtworks.length).toEqual(1)
  })

  it("passes exclude_disliked_artworks parameter to Gravity setItemsLoader", async () => {
    const mockSetsLoader = jest.fn(() => ({ body: [{ id: "valid_id" }] }))
    const mockSetItemsLoader = jest.fn(() => ({ body: [{}] }))
    const remainingSize = 1
    const includeBackfill = true
    const context = {
      setsLoader: mockSetsLoader,
      setItemsLoader: mockSetItemsLoader,
      authenticatedLoaders: {},
      unauthenticatedLoaders: {},
    } as any

    await getBackfillArtworks(
      remainingSize,
      includeBackfill,
      context,
      false,
      true
    )

    expect(mockSetItemsLoader).toBeCalledWith("valid_id", {
      exclude_disliked_artworks: true,
    })
  })

  it("returns backfilled from a collection for auction artworks", async () => {
    const mockFilterArtworksLoader = jest.fn(() => ({
      hits: [{ id: "backfill-artwork-id" }],
    }))
    const size = 1
    const includeBackfill = true
    const context = {
      authenticatedLoaders: {
        filterArtworksLoader: mockFilterArtworksLoader,
      },
      unauthenticatedLoaders: {
        filterArtworksLoader: mockFilterArtworksLoader,
      },
    } as any

    const backfillArtworks = await getBackfillArtworks(
      size,
      includeBackfill,
      context,
      true
    )

    expect(mockFilterArtworksLoader).toBeCalledWith({
      exclude_disliked_artworks: false,
      size: 1,
      sort: "-decayed_merch",
      marketing_collection_id: "top-auction-lots",
    })
    expect(backfillArtworks.map((artwork) => artwork.id)).toEqual([
      "backfill-artwork-id",
    ])
  })

  it("passes exclude_disliked_artworks to Gravity filterArtworksLoader", async () => {
    const mockFilterArtworksLoader = jest.fn(() => ({
      hits: [{ id: "backfill-artwork-id" }],
    }))
    const remainingSize = 1
    const includeBackfill = true
    const context = {
      authenticatedLoaders: {
        filterArtworksLoader: mockFilterArtworksLoader,
      },
      unauthenticatedLoaders: {
        filterArtworksLoader: mockFilterArtworksLoader,
      },
    } as any

    const backfillArtworks = await getBackfillArtworks(
      remainingSize,
      includeBackfill,
      context,
      true,
      true
    )

    expect(mockFilterArtworksLoader).toBeCalledWith({
      exclude_disliked_artworks: true,
      size: 1,
      sort: "-decayed_merch",
      marketing_collection_id: "top-auction-lots",
    })
    expect(backfillArtworks.map((artwork) => artwork.id)).toEqual([
      "backfill-artwork-id",
    ])
  })

  it("returns no more backfill than the remaining size asks for", async () => {
    const mockSetsLoader = jest.fn(() => ({ body: [{ id: "valid_id" }] }))
    const mockSetItemsLoader = jest.fn(() => ({ body: [{}, {}] }))
    const size = 1
    const includeBackfill = true
    const context = {
      setsLoader: mockSetsLoader,
      setItemsLoader: mockSetItemsLoader,
      authenticatedLoaders: {},
      unauthenticatedLoaders: {},
    } as any

    const backfillArtworks = await getBackfillArtworks(
      size,
      includeBackfill,
      context
    )

    expect(backfillArtworks.length).toEqual(1)
  })
})
