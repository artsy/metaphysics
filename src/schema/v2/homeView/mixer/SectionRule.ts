import { HomeViewSection } from "schema/v2/homeView/sections"
import { ResolverContext } from "types/graphql"

/**
 * Abstract base class for section rules.
 * Each rule may transform the list of sections.
 */
export abstract class SectionRule {
  /**
   * Method that transforms sections based on specific logic
   * @param sections List of sections to transform
   * @param context GraphQL resolver context
   * @returns Transformed list of sections
   */
  abstract apply(
    sections: HomeViewSection[],
    context: ResolverContext
  ): Promise<HomeViewSection[]>
}
