import { AuctionsHub } from "../AuctionsHub"

describe("AuctionsHub", () => {
  it("returns the correct section configuration", () => {
    expect(AuctionsHub.id).toBe("home-view-section-auctions-hub")
    expect(AuctionsHub.type).toBe("HomeViewSectionCards")
    expect(AuctionsHub.requiresAuthentication).toBe(false)
    expect(AuctionsHub.component?.title).toBe("Auctions Hub")
    expect(AuctionsHub.component?.type).toBe("3UpImageLayout")
    expect(AuctionsHub.featureFlag).toBe("onyx_auctions_hub")
  })

  it("returns 3 auction-related cards with correct image configurations", () => {
    const result = AuctionsHub.resolver!({}, {}, {} as any, {} as any)

    expect(result.edges).toHaveLength(3)

    // First card: single image
    expect(result.edges[0].node.title).toBe("Your Auction Picks")
    expect(result.edges[0].node.href).toBe("/your-auction-picks")
    expect(result.edges[0].node.entityType).toBe("AuctionPicks")
    expect(result.edges[0].node.imageURL).toBe(
      "https://cdn.artsy.net/auction-picks.jpg"
    )
    expect(result.edges[0].node.imageURLs).toBeUndefined()

    // Second card: multiple images
    expect(result.edges[1].node.title).toBe("Browse All Auctions")
    expect(result.edges[1].node.href).toBe("/auctions")
    expect(result.edges[1].node.entityType).toBe("Auctions")
    expect(result.edges[1].node.imageURL).toBeUndefined()
    expect(result.edges[1].node.imageURLs).toEqual([
      "https://cdn.artsy.net/auctions-1.jpg",
      "https://cdn.artsy.net/auctions-2.jpg",
      "https://cdn.artsy.net/auctions-3.jpg",
    ])

    // Third card: no images
    expect(result.edges[2].node.title).toBe("Latest Auction Results")
    expect(result.edges[2].node.href).toBe("/latest-auction-results")
    expect(result.edges[2].node.entityType).toBe("AuctionResults")
    expect(result.edges[2].node.imageURL).toBeUndefined()
    expect(result.edges[2].node.imageURLs).toBeUndefined()
  })

  it("demonstrates different image resolver behaviors", () => {
    const result = AuctionsHub.resolver!({}, {}, {} as any, {} as any)
    const cards = result.edges.map((edge) => edge.node)

    // Test that first card has single image
    const firstCard = cards[0]
    expect(firstCard.imageURL).toBe("https://cdn.artsy.net/auction-picks.jpg")

    // Test that second card has multiple images
    const secondCard = cards[1]
    expect(secondCard.imageURLs).toHaveLength(3)
    expect(secondCard.imageURLs?.[0]).toBe(
      "https://cdn.artsy.net/auctions-1.jpg"
    )

    // Test that third card has no images
    const thirdCard = cards[2]
    expect(thirdCard.imageURL).toBeUndefined()
    expect(thirdCard.imageURLs).toBeUndefined()
  })
})
