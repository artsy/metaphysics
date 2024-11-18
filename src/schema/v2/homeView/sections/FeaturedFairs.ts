import { ContextModule } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { HomePageFairsModuleType } from "schema/v2/home/home_page_fairs_module"
import { connectionFromArray } from "graphql-relay"
import { emptyConnection } from "schema/v2/fields/pagination"

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
    const { results: resolver } = HomePageFairsModuleType.getFields()

    if (!resolver?.resolve) {
      return emptyConnection
    }

    const result = await resolver.resolve(parent, args, context, info)

    return connectionFromArray(result, args)
  }),
}
