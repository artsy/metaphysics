import { ContextModule } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { HomePageMarketingCollectionsModuleType } from "schema/v2/home/home_page_marketing_collections_module"
import { connectionFromArray } from "graphql-relay"
import { emptyConnection } from "schema/v2/fields/pagination"

export const MarketingCollections: HomeViewSection = {
  id: "home-view-section-marketing-collections",
  type: HomeViewSectionTypeNames.HomeViewSectionMarketingCollections,
  contextModule: ContextModule.collectionRail,
  component: {
    title: "Collections",
  },
  requiresAuthentication: false,

  resolver: withHomeViewTimeout(async (parent, args, context, info) => {
    const {
      results: resolver,
    } = HomePageMarketingCollectionsModuleType.getFields()

    if (!resolver?.resolve) {
      return emptyConnection
    }

    const result = await resolver.resolve(parent, args, context, info)

    return connectionFromArray(result, args)
  }),
}
