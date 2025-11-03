import { AuctionsHub, shouldDisplayAuctionsHub } from "../AuctionsHub"

// Mock the artworksForUser module
jest.mock("schema/v2/artworksForUser", () => ({
  artworksForUser: {
    resolve: jest.fn(),
  },
}))

// Mock the AuctionResultsByFollowedArtists module
jest.mock("schema/v2/me/auctionResultsByFollowedArtists", () => ({
  __esModule: true,
  default: {
    resolve: jest.fn(),
  },
}))

describe("AuctionsHub", () => {
  it("returns the correct section configuration", () => {
    expect(AuctionsHub.id).toBe("home-view-section-auctions-hub")
    expect(AuctionsHub.type).toBe("HomeViewSectionCards")
    expect(AuctionsHub.requiresAuthentication).toBe(true)
    expect(AuctionsHub.component?.title).toBe("Discover Auctions on Artsy")
    expect(AuctionsHub.component?.type).toBe("3UpImageLayout")
    expect(AuctionsHub.shouldBeDisplayed).toBeDefined()
  })

  describe("shouldDisplayAuctionsHub", () => {
    it("returns false when no user agent is provided", () => {
      const context = { userAgent: undefined, userID: "user123" } as any
      expect(shouldDisplayAuctionsHub(context)).toBe(false)
    })

    it("returns false when user agent doesn't have version info", () => {
      const context = { userAgent: "Mozilla/5.0", userID: "user123" } as any
      expect(shouldDisplayAuctionsHub(context)).toBe(false)
    })
  })

  describe("resolver", () => {
    const mockContext = {
      accessToken: "mock-token",
      salesLoader: jest.fn(),
      saleArtworksLoader: jest.fn(),
      artworksForUser: {
        resolve: jest.fn(),
      },
      _root: {},
      info: {},
    }

    const mockSales = [
      {
        id: "sale1",
        image_urls: { source: "https://example.com/auction1-cover.jpg" },
        name: "Modern Art Auction",
      },
      {
        id: "sale2",
        image_urls: { source: "https://example.com/auction2-cover.jpg" },
        name: "Contemporary Art Sale",
      },
      {
        id: "sale3",
        image_urls: { source: "https://example.com/auction3-cover.jpg" },
        name: "Impressionist Works",
      },
    ]

    const mockSaleArtworks = {
      body: [
        {
          artwork: {
            images: [
              { image_urls: { main: "https://example.com/auction1.jpg" } },
            ],
          },
        },
        {
          artwork: {
            images: [
              { image_urls: { main: "https://example.com/auction2.jpg" } },
            ],
          },
        },
        {
          artwork: {
            images: [
              { image_urls: { main: "https://example.com/auction3.jpg" } },
            ],
          },
        },
      ],
    }

    const mockAuctionResults = {
      edges: [
        {
          node: {
            images: [{ larger: "https://example.com/result1.jpg" }],
            title: "Artwork 1",
          },
        },
        {
          node: {
            images: [{ larger: "https://example.com/result2.jpg" }],
            title: "Artwork 2",
          },
        },
        {
          node: {
            images: [{ larger: "https://example.com/result3.jpg" }],
            title: "Artwork 3",
          },
        },
      ],
    }

    const mockArtworks = {
      edges: [
        {
          node: {
            images: [
              { image_urls: { main: "https://example.com/artwork1.jpg" } },
            ],
          },
        },
        {
          node: {
            images: [
              { image_urls: { main: "https://example.com/artwork2.jpg" } },
            ],
          },
        },
        {
          node: {
            images: [
              { image_urls: { main: "https://example.com/artwork3.jpg" } },
            ],
          },
        },
      ],
    }

    beforeEach(() => {
      jest.clearAllMocks()
      mockContext.salesLoader.mockResolvedValue(mockSales)
      mockContext.saleArtworksLoader.mockResolvedValue(mockSaleArtworks)

      // Mock the artworksForUser resolver function
      const { artworksForUser } = require("schema/v2/artworksForUser")
      artworksForUser.resolve.mockResolvedValue(mockArtworks)

      // Mock the AuctionResultsByFollowedArtists resolver function
      const AuctionResultsByFollowedArtists = require("schema/v2/me/auctionResultsByFollowedArtists")
        .default
      AuctionResultsByFollowedArtists.resolve.mockResolvedValue(
        mockAuctionResults
      )
    })

    it("returns cards with dynamic image loading", async () => {
      const result = await AuctionsHub.resolver!(
        {},
        {},
        mockContext as any,
        {} as any
      )

      expect(result.edges).toHaveLength(3)

      // Your Auction Picks card
      const auctionPicksCard = result.edges[0].node
      expect(auctionPicksCard.title).toBe("Your Auction Picks")
      expect(auctionPicksCard.href).toBe("/auctions/lots-for-you-ending-soon")
      expect(auctionPicksCard.entityType).toBe("lotsForYou")
      expect(auctionPicksCard.entityID).toBe("card-your-auction-picks")
      expect(auctionPicksCard.imageURLs).toEqual([
        "https://example.com/artwork1.jpg",
        "https://example.com/artwork2.jpg",
        "https://example.com/artwork3.jpg",
      ])

      // Current and Upcoming Auctions card
      const auctionsCard = result.edges[1].node
      expect(auctionsCard.title).toBe("Current and Upcoming Auctions")
      expect(auctionsCard.href).toBe("/live-auctions")
      expect(auctionsCard.entityType).toBe("auctions")
      expect(auctionsCard.entityID).toBe("card-browse-all-auctions")
      expect(auctionsCard.imageURLs).toEqual([
        "https://example.com/auction1-cover.jpg",
        "https://example.com/auction2-cover.jpg",
        "https://example.com/auction3-cover.jpg",
      ])

      // Auction Results for Artist You Follow card
      const resultsCard = result.edges[2].node
      expect(resultsCard.title).toBe("Auction Results for Artist You Follow")
      expect(resultsCard.href).toBe("/auction-results-for-artists-you-follow")
      expect(resultsCard.entityType).toBe("auctionResultsForArtistsYouFollow")
      expect(resultsCard.entityID).toBe(
        "card-auction-results-for-artist-you-follow"
      )
      expect(resultsCard.imageURLs).toEqual([
        "https://example.com/result1.jpg",
        "https://example.com/result2.jpg",
        "https://example.com/result3.jpg",
      ])
    })

    it("throws error when loaders fail", async () => {
      mockContext.salesLoader.mockRejectedValue(
        new Error("Sales loader failed")
      )

      // Should throw the error instead of handling gracefully
      await expect(
        AuctionsHub.resolver!({}, {}, mockContext as any, {} as any)
      ).rejects.toThrow("Sales loader failed")
    })

    it("shows empty states when AuctionResultsByFollowedArtists is empty", async () => {
      // Mock empty results for all data sources
      const { artworksForUser } = require("schema/v2/artworksForUser")
      artworksForUser.resolve.mockResolvedValue({ edges: [] })

      mockContext.salesLoader.mockResolvedValue([])

      const AuctionResultsByFollowedArtists = require("schema/v2/me/auctionResultsByFollowedArtists")
        .default
      AuctionResultsByFollowedArtists.resolve.mockResolvedValue({ edges: [] })

      const result = await AuctionsHub.resolver!(
        {},
        {},
        mockContext as any,
        {} as any
      )

      // Should return two empty state cards when AuctionsHub reasults are empty
      expect(result.edges).toHaveLength(2)
      expect(result.edges[0].node.title).toBe(
        "No Current or Upcoming Auctions at this time"
      )
      expect(result.edges[1].node.title).toBe(
        "Follow and engage with artists to see auction results"
      )
    })

    it("returns cards with images and empty states when some have no images", async () => {
      // Mock yourAuctionPicksCard to have images
      const { artworksForUser } = require("schema/v2/artworksForUser")
      artworksForUser.resolve.mockResolvedValue(mockArtworks)

      // Mock browseAllAuctionsCard to have no images (empty sales)
      mockContext.salesLoader.mockResolvedValue([])

      // Mock latestAuctionResultsCard to have no images
      const AuctionResultsByFollowedArtists = require("schema/v2/me/auctionResultsByFollowedArtists")
        .default
      AuctionResultsByFollowedArtists.resolve.mockResolvedValue({ edges: [] })

      const result = await AuctionsHub.resolver!(
        {},
        {},
        mockContext as any,
        {} as any
      )

      // Should return the Your Auction Picks card and two empty state cards for the others
      expect(result.edges).toHaveLength(3)
      expect(result.edges[0].node.title).toBe("Your Auction Picks")
      expect(result.edges[1].node.title).toBe(
        "No Current or Upcoming Auctions at this time"
      )
      expect(result.edges[2].node.title).toBe(
        "Follow and engage with artists to see auction results"
      )
    })

    it("handles sales with no cover images or artwork images", async () => {
      // Mock sales without cover images
      const salesWithoutImages = [
        { id: "sale1", name: "Sale 1" }, // No image_urls property
        { id: "sale2", image_urls: {}, name: "Sale 2" }, // Empty image_urls
      ]
      mockContext.salesLoader.mockResolvedValue(salesWithoutImages)

      // Mock saleArtworksLoader to return empty results (no artwork images)
      mockContext.saleArtworksLoader.mockResolvedValue({ body: [] })

      // Mock other cards to have no images
      const { artworksForUser } = require("schema/v2/artworksForUser")
      artworksForUser.resolve.mockResolvedValue({ edges: [] })

      const AuctionResultsByFollowedArtists = require("schema/v2/me/auctionResultsByFollowedArtists")
        .default
      AuctionResultsByFollowedArtists.resolve.mockResolvedValue({ edges: [] })

      const result = await AuctionsHub.resolver!(
        {},
        {},
        mockContext as any,
        {} as any
      )

      // Should return only emty state card for Aucitons and AuctionResultsByFollowedArtists
      expect(result.edges).toHaveLength(2)
      expect(result.edges[0].node.title).toBe(
        "No Current or Upcoming Auctions at this time"
      )
      expect(result.edges[1].node.title).toBe(
        "Follow and engage with artists to see auction results"
      )
    })
  })
})
