import { HomeViewSection } from "schema/v2/homeView/sections"
import { ResolverContext } from "types/graphql"
import { FeatureFlag, getExperimentVariant } from "lib/featureFlags"
import { getEigenVersionNumber, isAtLeastVersion } from "lib/semanticVersioning"
import { HomeViewMixerRule } from "../HomeViewMixerRule"
import { Arm, composeForArm, isArm } from "./recipes"
import { HOME_VIEW_SECTION_GROUP_MINIMUM_EIGEN_VERSION } from "../../sectionTypes/groupMinimumEigenVersion"

// Must also be present in FEATURE_FLAGS_LIST (lib/featureFlags.ts) and
// CURRENTLY_RUNNING_EXPERIMENTS (experiments/experiments.ts).
export const HOME_FEED_SIMPLIFICATION_FLAG: FeatureFlag =
  "onyx_home-feed-simplification"

// Single source of truth for who the experiment applies to: we must be able to
// stably bucket the viewer (userID) and render the treatment (Eigen >= min
// version). Both arm composition and exposure reporting gate on this so they
// agree — an ineligible viewer sees the baseline and isn't reported as exposed.
export const isEligibleForHomeFeedSimplification = (
  context: ResolverContext
): boolean => {
  if (!context.userID) return false

  const eigenVersion = getEigenVersionNumber(context.userAgent as string)
  if (
    eigenVersion &&
    !isAtLeastVersion(
      eigenVersion,
      HOME_VIEW_SECTION_GROUP_MINIMUM_EIGEN_VERSION
    )
  ) {
    return false
  }

  return true
}

// Reshapes the feed per the user's experiment arm; no-op for control/unenrolled.
export class HomeFeedSimplificationRule extends HomeViewMixerRule {
  async apply(
    sections: HomeViewSection[],
    context: ResolverContext
  ): Promise<HomeViewSection[]> {
    const { arm, source } = this.resolveArm(context)
    context.homeViewAppliedArm = { arm, source }
    return composeForArm(arm, sections)
  }

  private resolveArm(
    context: ResolverContext
  ): {
    arm: Arm | null
    source: "override" | "unleash" | "ineligible"
  } {
    if (context.xHomeFeedArm && isArm(context.xHomeFeedArm)) {
      return { arm: context.xHomeFeedArm, source: "override" }
    }

    // Anonymous or too-old clients get the baseline, not a random/un-renderable arm.
    if (!isEligibleForHomeFeedSimplification(context)) {
      return { arm: null, source: "ineligible" }
    }

    const variant = getExperimentVariant(HOME_FEED_SIMPLIFICATION_FLAG, {
      userId: context.userID,
    })

    if (!variant || typeof variant === "boolean" || !variant.enabled) {
      return { arm: null, source: "unleash" }
    }
    return { arm: isArm(variant.name) ? variant.name : null, source: "unleash" }
  }
}
