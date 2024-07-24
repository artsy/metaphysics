import { collectorSignalsLoader } from "lib/loaders/collectorSignalsLoader"
import { isFeatureFlagEnabled } from "lib/featureFlags"

const mockIsFeatureFlagEnabled = isFeatureFlagEnabled as jest.Mock

// Mock context and artwork setup
const ctx = {
  userID: "testUser",
  mePartnerOffersLoader: jest.fn(),
  salesLoader: jest.fn(),
  saleArtworkLoader: jest.fn(),
}

const artwork = {
  _id: "artwork1",
  sale_ids: ["sale1"],
  purchasable: true,
  recent_saves_count: 10,
}

describe("collectorSignalsLoader", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it("returns empty signals when feature flags are disabled", async () => {
    mockIsFeatureFlagEnabled.mockReturnValue(false)

    const signals = await collectorSignalsLoader(artwork, ctx)

    expect(signals).toEqual({})
  })

  it("handles auction artwork signals when the artwork is in a biddable sale", async () => {
    mockIsFeatureFlagEnabled.mockImplementation(
      (flag) => flag === "emerald_signals-auction-improvements"
    )

    ctx.salesLoader.mockResolvedValue([
      {
        id: "sale1",
      },
    ])

    ctx.saleArtworkLoader.mockResolvedValue({
      bidder_positions_count: 5,
    })

    const signals = await collectorSignalsLoader(artwork, ctx)

    expect(ctx.salesLoader).toHaveBeenCalledWith({
      id: ["sale1"],
      is_auction: true,
      live: true,
    })

    expect(ctx.saleArtworkLoader).toHaveBeenCalledWith({
      saleArtworkId: "artwork1",
      saleId: "sale1",
    })

    expect(signals).toEqual({
      bidCount: 5,
      lotWatcherCount: 10,
    })
  })

  it("returns empty auction artwork signals when the artwork is not in a biddable sale", async () => {
    mockIsFeatureFlagEnabled.mockImplementation(
      (flag) => flag === "emerald_signals-auction-improvements"
    )

    ctx.salesLoader.mockResolvedValue([
      {
        id: "sale1",
      },
    ])

    ctx.saleArtworkLoader.mockResolvedValue(null)

    const signals = await collectorSignalsLoader(artwork, ctx)

    expect(ctx.salesLoader).toHaveBeenCalledWith({
      id: ["sale1"],
      is_auction: true,
      live: true,
    })

    expect(ctx.saleArtworkLoader).toHaveBeenCalledWith({
      saleArtworkId: "artwork1",
      saleId: "sale1",
    })

    expect(signals).toEqual({
      bidCount: undefined,
      lotWatcherCount: undefined,
    })
  })

  it("handles partner offer signals for purchasable artwork", async () => {
    mockIsFeatureFlagEnabled.mockImplementation(
      (flag) => flag === "emerald_signals-partner-offers"
    )
    ctx.mePartnerOffersLoader.mockResolvedValue({
      body: [{ endAt: "2023-01-01T00:00:00Z" }],
    })

    const signals = await collectorSignalsLoader(artwork, ctx)

    expect(signals).toEqual({
      partnerOffer: { endAt: "2023-01-01T00:00:00Z" },
    })
  })

  it("returns empty partner offer signals for a non-purchasable artwork", async () => {
    mockIsFeatureFlagEnabled.mockImplementation(
      (flag) => flag === "emerald_signals-partner-offers"
    )
    ctx.mePartnerOffersLoader.mockResolvedValue({
      body: [{ endAt: "2023-01-01T00:00:00Z" }],
    })

    artwork.purchasable = false
    const signals = await collectorSignalsLoader(artwork, ctx)

    expect(signals).toEqual({
      partnerOffer: undefined,
    })
  })
})
