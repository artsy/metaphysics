import { HomeViewSection } from "schema/v2/homeView/sections"
import { ResolverContext } from "types/graphql"
import { isSectionDisplayable } from "../../helpers/isSectionDisplayable"
import { HomeViewMixerRule } from "../HomeViewMixerRule"

/**
 * Rule that removes sections based on the isSectionDisplayable helper.
 */
export class DisplayableRule extends HomeViewMixerRule {
  async apply(
    sections: HomeViewSection[],
    context: ResolverContext
  ): Promise<HomeViewSection[]> {
    return sections.filter((section) => isSectionDisplayable(section, context))
  }
}
