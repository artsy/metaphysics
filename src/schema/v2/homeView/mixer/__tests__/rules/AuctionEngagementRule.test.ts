import { HomeViewSection } from "schema/v2/homeView/sections"
import { AuctionEngagementRule } from "../../rules/AuctionEngagementRule"
import { ResolverContext } from "types/graphql"
import { NewWorksForYou } from "../../../sections/NewWorksForYou"
import { AuctionLotsForYou } from "../../../sections/AuctionLotsForYou"
import { AuctionsHub } from "../../../sections/AuctionsHub"

describe("AuctionEngagementRule", () => {
  it("moves auction-related sections after NewWorksForYou for engaged users", async () => {
    const mockContext: Partial<ResolverContext> = {
      userID: "123",
      auctionUserSegmentationLoader: jest.fn().mockResolvedValue({
        data: [
          {
            user_id: "123",
            auction_segmentation: "engaged",
          },
        ],
      }),
    }

    const inputSections: Partial<HomeViewSection>[] = [
      { id: "quick-links-section" },
      { id: "tasks-section" },
      NewWorksForYou,
      { id: "some-section" },
      { id: "another-section" },
      AuctionLotsForYou,
      { id: "yet-another-section" },
      AuctionsHub,
      { id: "final-section" },
    ]

    const auctionEngagementRule = new AuctionEngagementRule()

    const outputSections = await auctionEngagementRule.apply(
      inputSections as HomeViewSection[],
      mockContext as ResolverContext
    )

    // Expect auction-related sections to be moved right after NewWorksForYou
    expect(outputSections).toEqual([
      { id: "quick-links-section" },
      { id: "tasks-section" },
      NewWorksForYou,
      AuctionLotsForYou,
      AuctionsHub,
      { id: "some-section" },
      { id: "another-section" },
      { id: "yet-another-section" },
      { id: "final-section" },
    ])
    expect(outputSections.length).toEqual(inputSections.length)
  })

  it("moves auction-related sections after NewWorksForYou for adjacent users", async () => {
    const mockContext: Partial<ResolverContext> = {
      userID: "123",
      auctionUserSegmentationLoader: jest.fn().mockResolvedValue({
        data: [
          {
            user_id: "123",
            auction_segmentation: "adjacent",
          },
        ],
      }),
    }

    const inputSections: Partial<HomeViewSection>[] = [
      { id: "quick-links-section" },
      { id: "tasks-section" },
      NewWorksForYou,
      { id: "some-section" },
      { id: "another-section" },
      AuctionLotsForYou,
      { id: "yet-another-section" },
      AuctionsHub,
      { id: "final-section" },
    ]

    const auctionEngagementRule = new AuctionEngagementRule()

    const outputSections = await auctionEngagementRule.apply(
      inputSections as HomeViewSection[],
      mockContext as ResolverContext
    )

    // Expect auction-related sections to be moved right after NewWorksForYou
    expect(outputSections).toEqual([
      { id: "quick-links-section" },
      { id: "tasks-section" },
      NewWorksForYou,
      AuctionLotsForYou,
      AuctionsHub,
      { id: "some-section" },
      { id: "another-section" },
      { id: "yet-another-section" },
      { id: "final-section" },
    ])
    expect(outputSections.length).toEqual(inputSections.length)
  })

  it("leaves sections unchanged for disengaged users", async () => {
    const mockContext: Partial<ResolverContext> = {
      userID: "123",
      auctionUserSegmentationLoader: jest.fn().mockResolvedValue({
        data: [
          {
            user_id: "123",
            auction_segmentation: "disengaged",
          },
        ],
      }),
    }

    const inputSections: Partial<HomeViewSection>[] = [
      { id: "quick-links-section" },
      { id: "tasks-section" },
      NewWorksForYou,
      { id: "some-section" },
      { id: "another-section" },
      AuctionLotsForYou,
      { id: "yet-another-section" },
      AuctionsHub,
      { id: "final-section" },
    ]

    const auctionEngagementRule = new AuctionEngagementRule()

    const outputSections = await auctionEngagementRule.apply(
      inputSections as HomeViewSection[],
      mockContext as ResolverContext
    )

    // Expect sections to remain in original order
    expect(outputSections).toEqual(inputSections)
  })

  it("leaves sections unchanged for new users", async () => {
    const mockContext: Partial<ResolverContext> = {
      userID: "123",
      auctionUserSegmentationLoader: jest.fn().mockResolvedValue({
        data: [
          {
            user_id: "123",
            auction_segmentation: "new",
          },
        ],
      }),
    }

    const inputSections: Partial<HomeViewSection>[] = [
      { id: "quick-links-section" },
      { id: "tasks-section" },
      NewWorksForYou,
      { id: "some-section" },
      { id: "another-section" },
      AuctionLotsForYou,
      { id: "yet-another-section" },
      AuctionsHub,
      { id: "final-section" },
    ]

    const auctionEngagementRule = new AuctionEngagementRule()

    const outputSections = await auctionEngagementRule.apply(
      inputSections as HomeViewSection[],
      mockContext as ResolverContext
    )

    // Expect sections to remain in original order
    expect(outputSections).toEqual(inputSections)
  })

  it("leaves sections unchanged when segmentation data is missing", async () => {
    const mockContext: Partial<ResolverContext> = {
      userID: "123",
      auctionUserSegmentationLoader: jest.fn().mockResolvedValue({
        data: [], // Empty data
      }),
    }

    const inputSections: Partial<HomeViewSection>[] = [
      { id: "quick-links-section" },
      { id: "tasks-section" },
      NewWorksForYou,
      { id: "some-section" },
      { id: "another-section" },
      AuctionLotsForYou,
      { id: "yet-another-section" },
      AuctionsHub,
      { id: "final-section" },
    ]

    const auctionEngagementRule = new AuctionEngagementRule()

    const outputSections = await auctionEngagementRule.apply(
      inputSections as HomeViewSection[],
      mockContext as ResolverContext
    )

    // Expect sections to remain in original order
    expect(outputSections).toEqual(inputSections)
  })

  it("handles errors gracefully", async () => {
    const mockContext: Partial<ResolverContext> = {
      userID: "123",
      auctionUserSegmentationLoader: jest
        .fn()
        .mockRejectedValue(new Error("Test error")),
    }

    const inputSections: Partial<HomeViewSection>[] = [
      { id: "quick-links-section" },
      { id: "tasks-section" },
      NewWorksForYou,
      { id: "some-section" },
      { id: "another-section" },
      AuctionLotsForYou,
      { id: "yet-another-section" },
      AuctionsHub,
      { id: "final-section" },
    ]

    const auctionEngagementRule = new AuctionEngagementRule()

    const outputSections = await auctionEngagementRule.apply(
      inputSections as HomeViewSection[],
      mockContext as ResolverContext
    )

    // Expect sections to remain in original order
    expect(outputSections).toEqual(inputSections)
  })
})
