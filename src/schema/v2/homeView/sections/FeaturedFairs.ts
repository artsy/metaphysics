import { ContextModule } from "@artsy/cohesion"
import { FeaturedFairsConnection } from "schema/v2/FeaturedFairs/featuredFairsConnection"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"

export const FeaturedFairs: HomeViewSection = {
  id: "home-view-section-featured-fairs",
  type: HomeViewSectionTypeNames.HomeViewSectionFairs,
  contextModule: ContextModule.fairRail,
  component: {
    title: "Featured Fairs",
    description: "See works in top art fairs",
  },
  featureFlag: "onyx_enable-home-view-section-featured-fairs",
  requiresAuthentication: false,

  resolver: withHomeViewTimeout(async (parent, args, context, info) => {
    const finalArgs = {
      includeBackfill: true,
      ...args,
    }
    const result = await FeaturedFairsConnection.resolve!(
      parent,
      finalArgs,
      context,
      info
    )

    return result
  }),
}
