import { HomeViewSection } from "schema/v2/homeView/sections"
import { ResolverContext } from "types/graphql"
import { FeatureFlag, getExperimentVariant } from "lib/featureFlags"
import { HomeViewMixerRule } from "../HomeViewMixerRule"
import { Arm, composeForArm, isArm } from "./recipes"

// Must also be present in FEATURE_FLAGS_LIST (lib/featureFlags.ts) and
// CURRENTLY_RUNNING_EXPERIMENTS (experiments/experiments.ts).
export const HOME_FEED_SIMPLIFICATION_FLAG: FeatureFlag =
  "onyx_home-feed-simplification"

// Reshapes the feed per the user's experiment arm; no-op for control/unenrolled.
// Mirrors AuctionEngagementRule: read a request-scoped signal, transform sections.
export class HomeFeedSimplificationRule extends HomeViewMixerRule {
  async apply(
    sections: HomeViewSection[],
    context: ResolverContext
  ): Promise<HomeViewSection[]> {
    const { arm, source } = this.resolveArm(context)
    // Surfaced in extensions (non-prod) for at-a-glance debugging.
    context.homeViewAppliedArm = { arm, source }
    return composeForArm(arm, sections)
  }

  private resolveArm(
    context: ResolverContext
  ): { arm: Arm | null; source: "override" | "unleash" } {
    // Dev/QA override via x-home-feed-arm header (non-prod); doesn't affect tracked variant.
    if (context.xHomeFeedArm && isArm(context.xHomeFeedArm)) {
      return { arm: context.xHomeFeedArm, source: "override" }
    }

    const variant = getExperimentVariant(HOME_FEED_SIMPLIFICATION_FLAG, {
      userId: context.userID,
    })
    // getExperimentVariant returns `false` if Unleash isn't initialized.
    if (!variant || typeof variant === "boolean" || !variant.enabled) {
      return { arm: null, source: "unleash" }
    }
    return { arm: isArm(variant.name) ? variant.name : null, source: "unleash" }
  }
}
