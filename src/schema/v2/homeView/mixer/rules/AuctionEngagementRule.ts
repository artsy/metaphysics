import { HomeViewSection } from "schema/v2/homeView/sections"
import { ResolverContext } from "types/graphql"
import { HomeViewMixerRule } from "../HomeViewMixerRule"
import { NewWorksForYou } from "../../sections/NewWorksForYou"
import { AuctionLotsForYou } from "../../sections/AuctionLotsForYou"
import { AuctionsHub } from "../../sections/AuctionsHub"
import { compact } from "lodash"

/**
 * Rule that moves auction-related sections near the top for eligible users
 * based on their auction segmentation.
 *
 * See: https://www.notion.so/artsy/19fcab0764a080229129edbd6efa7dce
 */
export class AuctionEngagementRule extends HomeViewMixerRule {
  async apply(
    sections: HomeViewSection[],
    context: ResolverContext
  ): Promise<HomeViewSection[]> {
    const segment = await getUserAuctionSegmentation(context)

    // for eligible user segments
    if (segment === "adjacent" || segment === "engaged") {
      // find the auction-related sections
      const auctionRelatedSections = [AuctionLotsForYou, AuctionsHub]
      // and remove them
      const sectionsToMove = auctionRelatedSections.map((section) => {
        const index = sections.findIndex((s) => s.id === section.id)
        if (index !== -1) {
          const [removed] = sections.splice(index, 1)
          return removed
        }
      })
      // then re-insert them right after NewWorksForYou
      const newWorksForYouIndex = sections.findIndex(
        (section) => section.id === NewWorksForYou.id
      )
      sections.splice(newWorksForYouIndex + 1, 0, ...compact(sectionsToMove))
    }

    return sections
  }
}

function getUserAuctionSegmentation(context: ResolverContext) {
  return context
    .auctionUserSegmentationLoader?.()
    .then((response) => response?.data?.[0]?.auction_segmentation)
    .catch(() => null)
}
