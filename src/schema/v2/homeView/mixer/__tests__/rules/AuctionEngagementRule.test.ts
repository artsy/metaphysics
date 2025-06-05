import { HomeViewSection } from "schema/v2/homeView/sections"
import { AuctionEngagementRule } from "../../rules/AuctionEngagementRule"
import { ResolverContext } from "types/graphql"
import { NewWorksForYou } from "../../../sections/NewWorksForYou"
import { AuctionLotsForYou } from "../../../sections/AuctionLotsForYou"
import { isFeatureFlagEnabled } from "lib/featureFlags"

const mockIsFeatureFlagEnabled = isFeatureFlagEnabled as jest.Mock

describe("AuctionEngagementRule", () => {
  beforeEach(() => {
    mockIsFeatureFlagEnabled.mockImplementation((flag: string) => {
      if (flag === "onyx_enable-home-view-auction-segmentation") return true
    })
  })
  it("moves only AuctionLotsForYou after NewWorksForYou for engaged users", async () => {
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
    ]

    const auctionEngagementRule = new AuctionEngagementRule()

    const outputSections = await auctionEngagementRule.apply(
      inputSections as HomeViewSection[],
      mockContext as ResolverContext
    )

    // Expect only AuctionLotsForYou to be moved right after NewWorksForYou
    expect(outputSections).toEqual([
      { id: "quick-links-section" },
      { id: "tasks-section" },
      NewWorksForYou,
      AuctionLotsForYou,
      { id: "some-section" },
      { id: "another-section" },
      { id: "yet-another-section" },
    ])
    expect(outputSections.length).toEqual(inputSections.length)
  })

  it("moves only AuctionLotsForYou after NewWorksForYou for adjacent users", async () => {
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
    ]

    const auctionEngagementRule = new AuctionEngagementRule()

    const outputSections = await auctionEngagementRule.apply(
      inputSections as HomeViewSection[],
      mockContext as ResolverContext
    )

    // Expect only AuctionLotsForYou to be moved right after NewWorksForYou
    expect(outputSections).toEqual([
      { id: "quick-links-section" },
      { id: "tasks-section" },
      NewWorksForYou,
      AuctionLotsForYou,
      { id: "some-section" },
      { id: "another-section" },
      { id: "yet-another-section" },
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
