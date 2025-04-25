import { HomeViewSection } from "schema/v2/homeView/sections"
import { ResolverContext } from "types/graphql"
import { HomeViewMixerRule } from "./HomeViewMixerRule"

/**
 * Orchestrates the application of multiple rules to a list of sections.
 */
export class HomeViewMixer {
  private rules: HomeViewMixerRule[]

  /**
   * Create a new HomeViewMixer with the specified rules.
   * @param rules Array of section rules to apply in sequence
   */
  constructor(rules: HomeViewMixerRule[]) {
    this.rules = rules
  }

  /**
   * Apply all rules sequentially to the provided sections.
   * @param initialSections Initial list of sections to process
   * @param context GraphQL resolver context
   * @returns Final list of sections after all rules have been applied
   */
  async mix(
    initialSections: HomeViewSection[],
    context: ResolverContext
  ): Promise<HomeViewSection[]> {
    let sections = [...initialSections]

    for (const rule of this.rules) {
      sections = await rule.apply(sections, context)
    }

    return sections
  }
}
