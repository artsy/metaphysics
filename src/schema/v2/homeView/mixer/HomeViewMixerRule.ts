import { HomeViewSection } from "schema/v2/homeView/sections"
import { ResolverContext } from "types/graphql"

/**
 * Abstract base class for mixer rules.
 *
 * Each rule may transform the list of sections, based on its own logic
 * and the provided GraphQL request context.
 */
export abstract class HomeViewMixerRule {
  /**
   * Transforms a list of incoming sections
   * @param sections List of sections to transform
   * @param context GraphQL resolver context
   * @returns Transformed list of sections
   */
  abstract apply(
    sections: HomeViewSection[],
    context: ResolverContext
  ): Promise<HomeViewSection[]>
}
