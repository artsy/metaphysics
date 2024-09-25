import { ResolverContext } from "types/graphql"
import { HomeViewSection } from "../sections"
import { isFeatureFlagEnabled } from "lib/featureFlags"

/**
 * Determine if an individual section can be displayed, considering the current
 * context, session, feature flags, etc.
 */
export function isSectionDisplayable(
  section: HomeViewSection,
  context: ResolverContext
): boolean {
  // public content
  const isPublicSection = section.requiresAuthentication === false

  // personalized content
  const isAuthenticatedUser = !!context.accessToken
  const isValidPersonalizedSection =
    section.requiresAuthentication && isAuthenticatedUser

  let isDisplayable = isPublicSection || isValidPersonalizedSection

  // feature flags
  if (isDisplayable && section.featureFlag) {
    isDisplayable = isFeatureFlagEnabled(section.featureFlag, {
      userId: context.userID,
    })
  }

  // section's display pre-check
  if (typeof section.shouldBeDisplayed === "function") {
    isDisplayable = isDisplayable && section?.shouldBeDisplayed(context)
  }

  return isDisplayable
}
