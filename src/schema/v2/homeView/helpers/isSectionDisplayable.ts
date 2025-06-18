import { ResolverContext } from "types/graphql"
import { HomeViewSection } from "../sections"
import { isFeatureFlagEnabled } from "lib/featureFlags"
import {
  getEigenVersionNumber,
  isAtLeastVersion,
  isAtMostVersion,
} from "lib/semanticVersioning"

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

  const actualEigenVersion = getEigenVersionNumber(context.userAgent as string)

  // minimum Eigen version
  if (isDisplayable && section.minimumEigenVersion && actualEigenVersion) {
    isDisplayable = isAtLeastVersion(
      actualEigenVersion,
      section.minimumEigenVersion
    )
  }

  // maximum Eigen version
  if (isDisplayable && section.maximumEigenVersion && actualEigenVersion) {
    isDisplayable = isAtMostVersion(
      actualEigenVersion,
      section.maximumEigenVersion
    )
  }

  // section's display pre-check
  if (typeof section.shouldBeDisplayed === "function") {
    isDisplayable = isDisplayable && section?.shouldBeDisplayed(context)
  }

  return isDisplayable
}
