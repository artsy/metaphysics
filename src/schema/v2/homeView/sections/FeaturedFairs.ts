import { ContextModule, OwnerType } from "@artsy/cohesion"
import { FeaturedFairs as FeaturedFairsType } from "schema/v2/FeaturedFairs/featuredFairs"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { connectionFromArray } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"

export const FeaturedFairs: HomeViewSection = {
  id: "home-view-section-featured-fairs",
  type: HomeViewSectionTypeNames.HomeViewSectionFairs,
  contextModule: ContextModule.fairRail,
  component: {
    title: "Featured Fairs",
    description: "See works in top art fairs",
  },
  requiresAuthentication: false,
  ownerType: OwnerType.featuredFairs,

  resolver: withHomeViewTimeout(async (parent, args, context, info) => {
    const { size } = convertConnectionArgsToGravityArgs(args)

    const featuredFairs = await FeaturedFairsType.resolve!(
      parent,
      { size, includeBackfill: true },
      context,
      info
    )

    return connectionFromArray(featuredFairs, args)
  }),
}
