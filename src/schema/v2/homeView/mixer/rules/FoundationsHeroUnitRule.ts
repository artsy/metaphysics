import { HomeViewSection } from "schema/v2/homeView/sections"
import { ResolverContext } from "types/graphql"
import { HomeViewMixerRule } from "../HomeViewMixerRule"
import { NewWorksForYou } from "../../sections/NewWorksForYou"
import { LatestActivity } from "../../sections/LatestActivity"
import { Tasks } from "../../sections/Tasks"
import { QuickLinks } from "../../sections/QuickLinks"
import { FoundationsHeroUnit } from "../../sections/FoundationsHeroUnit"

/**
 * Ensures FoundationsHeroUnit ends up directly below the top anchor section
 * (NewWorksForYou, else LatestActivity, else Tasks, else QuickLinks), even
 * after AuctionEngagementRule has repositioned AuctionLotsForYou into the
 * same slot.
 *
 * Temporary - remove after the Foundations 2026 ends.
 */
export class FoundationsHeroUnitRule extends HomeViewMixerRule {
  private static readonly ANCHOR_IDS = [
    NewWorksForYou.id,
    LatestActivity.id,
    Tasks.id,
    QuickLinks.id,
  ]

  async apply(
    sections: HomeViewSection[],
    _context: ResolverContext
  ): Promise<HomeViewSection[]> {
    const foundationsIndex = sections.findIndex(
      (s) => s.id === FoundationsHeroUnit.id
    )
    if (foundationsIndex === -1) return sections

    const [foundations] = sections.splice(foundationsIndex, 1)

    const anchorIndex = FoundationsHeroUnitRule.ANCHOR_IDS.map((id) =>
      sections.findIndex((s) => s.id === id)
    ).find((index) => index !== -1)

    if (anchorIndex === undefined) {
      sections.unshift(foundations)
    } else {
      sections.splice(anchorIndex + 1, 0, foundations)
    }

    return sections
  }
}
