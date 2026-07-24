import { isFeatureFlagEnabled } from "lib/featureFlags"
import { HTTPError } from "lib/HTTPError"
import {
  getBackfillArtworks,
  getNewForYouArtworkIDs,
  getNewForYouArtworks,
} from "../helpers"

jest.mock("lib/featureFlags", () => ({
  isFeatureFlagEnabled: jest.fn(() => false),
}))

const mockIsFeatureFlagEnabled = isFeatureFlagEnabled as jest.Mock

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

  it("stays on Vortex when the Gravity rail flag is off, even if the loader exists", async () => {
    const vortexLoader = mockLoaderFactory([{ artworkId: "banksy" }])
    const artworkRecommendationsLoader = jest.fn()
    const context = {
      artworkRecommendationsLoader,
      authenticatedLoaders: { vortexGraphqlLoader: () => vortexLoader },
      unauthenticatedLoaders: { vortexGraphqlLoader: vortexLoader },
    } as any

    const artworkIds = await getNewForYouArtworkIDs(
      { excludeArtworkIds: [] },
      context
    )

    expect(artworkRecommendationsLoader).not.toHaveBeenCalled()
    expect(vortexLoader).toHaveBeenCalled()
    expect(artworkIds).toEqual(["banksy"])
  })

  describe("when the Gravity NWFY rail is enabled", () => {
    beforeEach(() => {
      mockIsFeatureFlagEnabled.mockReturnValue(true)
    })

    afterEach(() => {
      mockIsFeatureFlagEnabled.mockReset()
      mockIsFeatureFlagEnabled.mockReturnValue(false)
    })

    it("sources IDs from the Gravity nwfy rail and skips Vortex", async () => {
      const vortexLoader = mockLoaderFactory([{ artworkId: "banksy" }])
      const artworkRecommendationsLoader = jest.fn(async () => ({
        artwork_ids: ["a1", "a2"],
      }))
      const context = {
        artworkRecommendationsLoader,
        authenticatedLoaders: { vortexGraphqlLoader: () => vortexLoader },
        unauthenticatedLoaders: { vortexGraphqlLoader: vortexLoader },
      } as any

      const artworkIds = await getNewForYouArtworkIDs(
        { excludeArtworkIds: [], maxWorksPerArtist: 3 },
        context
      )

      expect(artworkRecommendationsLoader).toHaveBeenCalledWith({
        rail: "nwfy",
        size: 50,
        max_per_artist: 3,
      })
      expect(vortexLoader).not.toHaveBeenCalled()
      expect(artworkIds).toEqual(["a1", "a2"])
    })

    it("treats a Gravity 404 as no recommendations (falls through to backfill)", async () => {
      const artworkRecommendationsLoader = jest.fn(async () => {
        throw new HTTPError("Not Found", 404)
      })
      const context = {
        artworkRecommendationsLoader,
        authenticatedLoaders: { vortexGraphqlLoader: () => jest.fn() },
        unauthenticatedLoaders: { vortexGraphqlLoader: jest.fn() },
      } as any

      const artworkIds = await getNewForYouArtworkIDs(
        { excludeArtworkIds: [] },
        context
      )

      expect(artworkIds).toEqual([])
    })

    it("propagates a non-404 Gravity error", async () => {
      const artworkRecommendationsLoader = jest.fn(async () => {
        throw new HTTPError("Internal Server Error", 500)
      })
      const context = {
        artworkRecommendationsLoader,
        authenticatedLoaders: { vortexGraphqlLoader: () => jest.fn() },
        unauthenticatedLoaders: { vortexGraphqlLoader: jest.fn() },
      } as any

      await expect(
        getNewForYouArtworkIDs({ excludeArtworkIds: [] }, context)
      ).rejects.toThrow("Internal Server Error")
    })

    it("keeps email-campaign requests (Braze, impersonated) on Vortex", async () => {
      const vortexLoader = mockLoaderFactory([{ artworkId: "banksy" }])
      const artworkRecommendationsLoader = jest.fn(async () => ({
        artwork_ids: ["imp-1", "imp-2"],
      }))
      const context = {
        artworkRecommendationsLoader,
        xImpersonateUserID: "braze-user-id",
        authenticatedLoaders: { vortexGraphqlLoader: () => vortexLoader },
        unauthenticatedLoaders: { vortexGraphqlLoader: () => vortexLoader },
      } as any

      const artworkIds = await getNewForYouArtworkIDs(
        { excludeArtworkIds: [] },
        context
      )

      expect(artworkRecommendationsLoader).not.toHaveBeenCalled()
      expect(vortexLoader).toHaveBeenCalled()
      expect(artworkIds).toEqual(["banksy"])
    })

    it("routes explicit userId-arg requests to Gravity with a user_id", async () => {
      const vortexLoader = mockLoaderFactory([{ artworkId: "banksy" }])
      const artworkRecommendationsLoader = jest.fn(async () => ({
        artwork_ids: ["app-1"],
      }))
      const context = {
        artworkRecommendationsLoader,
        authenticatedLoaders: { vortexGraphqlLoader: () => vortexLoader },
        unauthenticatedLoaders: { vortexGraphqlLoader: vortexLoader },
      } as any

      const artworkIds = await getNewForYouArtworkIDs(
        { excludeArtworkIds: [], userId: "app-user-id" },
        context
      )

      expect(artworkRecommendationsLoader).toHaveBeenCalledWith({
        rail: "nwfy",
        size: 50,
        user_id: "app-user-id",
      })
      expect(mockIsFeatureFlagEnabled).toHaveBeenCalledWith(
        "onyx_nwfy-gravity",
        {
          userId: "app-user-id",
        }
      )
      expect(vortexLoader).not.toHaveBeenCalled()
      expect(artworkIds).toEqual(["app-1"])
    })

    it("buckets the feature flag on the authenticated user for logged-in requests", async () => {
      const vortexLoader = mockLoaderFactory([{ artworkId: "banksy" }])
      const artworkRecommendationsLoader = jest.fn(async () => ({
        artwork_ids: ["a1"],
      }))
      const context = {
        artworkRecommendationsLoader,
        userID: "logged-in-user",
        authenticatedLoaders: { vortexGraphqlLoader: () => vortexLoader },
        unauthenticatedLoaders: { vortexGraphqlLoader: vortexLoader },
      } as any

      const artworkIds = await getNewForYouArtworkIDs(
        { excludeArtworkIds: [] },
        context
      )

      expect(mockIsFeatureFlagEnabled).toHaveBeenCalledWith(
        "onyx_nwfy-gravity",
        {
          userId: "logged-in-user",
        }
      )
      expect(artworkRecommendationsLoader).toHaveBeenCalledWith({
        rail: "nwfy",
        size: 50,
      })
      expect(vortexLoader).not.toHaveBeenCalled()
      expect(artworkIds).toEqual(["a1"])
    })

    it("stays on the auction path for onlyAtAuction requests", async () => {
      const auctionLoader = jest.fn(async () => ({
        data: [{ artwork_id: "lot-1" }],
      }))
      const artworkRecommendationsLoader = jest.fn()
      const context = {
        artworkRecommendationsLoader,
        authenticatedLoaders: {
          vortexGraphqlLoader: () => jest.fn(),
          auctionLotRecommendationsLoader: auctionLoader,
        },
        unauthenticatedLoaders: {
          vortexGraphqlLoader: jest.fn(),
          auctionLotRecommendationsLoader: auctionLoader,
        },
      } as any

      const artworkIds = await getNewForYouArtworkIDs(
        { excludeArtworkIds: [], onlyAtAuction: true },
        context
      )

      expect(artworkRecommendationsLoader).not.toHaveBeenCalled()
      expect(artworkIds).toEqual(["lot-1"])
    })
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

    const { artworks, totalCount } = await getBackfillArtworks({
      size,
      includeBackfill,
      context,
    })

    expect(artworks).toEqual([])
    expect(totalCount).toEqual(0)
  })

  it("returns an empty array with zero remaining size", async () => {
    const size = 0
    const includeBackfill = true
    const context = {} as any

    const { artworks, totalCount } = await getBackfillArtworks({
      size,
      includeBackfill,
      context,
    })

    expect(artworks).toEqual([])
    expect(totalCount).toEqual(0)
  })

  it("returns an empty array with no backfill id", async () => {
    const mockSetsLoader = jest.fn(() => ({ body: [] }))
    const size = 6
    const includeBackfill = false
    const context = {
      setsLoader: mockSetsLoader,
    } as any

    const { artworks, totalCount } = await getBackfillArtworks({
      size,
      includeBackfill,
      context,
    })

    expect(artworks).toEqual([])
    expect(totalCount).toEqual(0)
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

    const { artworks, totalCount } = await getBackfillArtworks({
      size,
      includeBackfill,
      context,
    })

    expect(mockSetItemsLoader).toBeCalledWith("valid_id", {
      exclude_disliked_artworks: false,
    })
    expect(artworks.length).toEqual(1)
    expect(totalCount).toEqual(1)
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

    await getBackfillArtworks({
      size: remainingSize,
      includeBackfill,
      context,
      onlyAtAuction: false,
      excludeDislikedArtworks: true,
    })

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

    const { artworks, totalCount } = await getBackfillArtworks({
      size,
      includeBackfill,
      context,
      onlyAtAuction: true,
    })

    expect(mockFilterArtworksLoader).toBeCalledWith({
      exclude_disliked_artworks: false,
      size: 1,
      sort: "-decayed_merch",
      marketing_collection_id: "top-auction-lots",
    })
    expect(artworks.map((artwork) => artwork.id)).toEqual([
      "backfill-artwork-id",
    ])
    expect(totalCount).toEqual(1)
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

    const { artworks, totalCount } = await getBackfillArtworks({
      size: remainingSize,
      includeBackfill,
      context,
      onlyAtAuction: true,
      excludeDislikedArtworks: true,
    })

    expect(mockFilterArtworksLoader).toBeCalledWith({
      exclude_disliked_artworks: true,
      size: 1,
      sort: "-decayed_merch",
      marketing_collection_id: "top-auction-lots",
    })
    expect(artworks.map((artwork) => artwork.id)).toEqual([
      "backfill-artwork-id",
    ])
    expect(totalCount).toEqual(1)
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

    const { artworks, totalCount } = await getBackfillArtworks({
      size,
      includeBackfill,
      context,
    })

    expect(artworks.length).toEqual(1)
    expect(totalCount).toEqual(2)
  })

  describe("when a marketing collection ID is provided", () => {
    it("calls the filterArtworksLoader with the marketing collection ID and returns the artworks", async () => {
      const mockFilterArtworksLoader = jest.fn(() => ({
        hits: [{ id: "collection-artwork-id" }],
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

      const { artworks, totalCount } = await getBackfillArtworks({
        size,
        includeBackfill,
        context,
        marketingCollectionId: "new-this-week",
      })

      expect(mockFilterArtworksLoader).toBeCalledWith({
        exclude_disliked_artworks: false,
        size: 1,
        sort: "-decayed_merch",
        marketing_collection_id: "new-this-week",
      })
      expect(artworks.map((artwork) => artwork.id)).toEqual([
        "collection-artwork-id",
      ])
      expect(totalCount).toEqual(1)
    })

    it("returns an error when specified together with onlyAtAuction being true", async () => {
      await expect(
        getBackfillArtworks({
          size: 1,
          includeBackfill: true,
          context: {} as any,
          marketingCollectionId: "new-this-week",
          onlyAtAuction: true,
        })
      ).rejects.toThrow(
        "marketingCollectionId and onlyAtAuction cannot be used together"
      )
    })
  })
})
