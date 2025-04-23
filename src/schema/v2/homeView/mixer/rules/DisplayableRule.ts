import { HomeViewSection } from "schema/v2/homeView/sections"
import { ResolverContext } from "types/graphql"
import { isSectionDisplayable } from "../../helpers/isSectionDisplayable"
import { SectionRule } from "../SectionRule"

/**
 * Rule that removes sections based on the isSectionDisplayable helper.
 */
export class DisplayableRule extends SectionRule {
  async apply(
    sections: HomeViewSection[],
    context: ResolverContext
  ): Promise<HomeViewSection[]> {
    return sections.filter((section) => isSectionDisplayable(section, context))
  }
}
