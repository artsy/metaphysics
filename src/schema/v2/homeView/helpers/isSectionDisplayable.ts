import { ResolverContext } from "types/graphql"
import { HomeViewSection } from "../sections"
import { isFeatureFlagEnabled } from "lib/featureFlags"
import { getEigenVersionNumber, isAtLeastVersion } from "lib/semanticVersioning"

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

  section.id === "home-view-section-infinite-discovery" &&
    console.log(
      "[INFINITE_DISCO] before check",
      JSON.stringify({
        id: section.id,
        isDisplayable,
        sectionMinimumEigenVersion: section.minimumEigenVersion,
        userId: context.userID,
      })
    )
  // minimum Eigen version
  if (isDisplayable && section.minimumEigenVersion) {
    const actualEigenVersion = getEigenVersionNumber(
      context.userAgent as string
    )
    section.id === "home-view-section-infinite-discovery" &&
      console.log(
        "[INFINITE_DISCO] checking",
        JSON.stringify({
          actualEigenVersion,
          contextUserAgent: context.userAgent,
          userId: context.userID,
        })
      )

    if (actualEigenVersion) {
      section.id === "home-view-section-infinite-discovery" &&
        console.log(
          "[INFINITE_DISCO] isAtLeast?",
          isAtLeastVersion(actualEigenVersion, section.minimumEigenVersion)
        )
      isDisplayable = isAtLeastVersion(
        actualEigenVersion,
        section.minimumEigenVersion
      )
    }
  }
  section.id === "home-view-section-infinite-discovery" &&
    console.log(
      "[INFINITE_DISCO] after check",
      JSON.stringify({
        id: section.id,
        isDisplayable,
        sectionMinimumEigenVersion: section.minimumEigenVersion,
        userId: context.userID,
      })
    )

  // section's display pre-check
  if (typeof section.shouldBeDisplayed === "function") {
    isDisplayable = isDisplayable && section?.shouldBeDisplayed(context)
  }

  section.id === "home-view-section-infinite-discovery" &&
    console.log(
      "[INFINITE_DISCO] finally",
      JSON.stringify({
        id: section.id,
        isDisplayable,
        userId: context.userID,
      })
    )

  return isDisplayable
}
