import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { HomePageSalesModuleType } from "schema/v2/home/home_page_sales_module"
import { connectionFromArray } from "graphql-relay"

export const Auctions: HomeViewSection = {
  id: "home-view-section-auctions",
  type: HomeViewSectionTypeNames.HomeViewSectionSales,
  contextModule: ContextModule.auctionRail,
  component: {
    title: "Auctions",
    behaviors: {
      viewAll: {
        href: "/auctions",
        buttonText: "Browse All Auctions",
        ownerType: OwnerType.auctions,
      },
    },
  },
  requiresAuthentication: false,

  resolver: withHomeViewTimeout(async (parent, args, context, info) => {
    const { results: resolver } = HomePageSalesModuleType.getFields()

    if (!resolver?.resolve) {
      return []
    }

    const result = await resolver.resolve(parent, args, context, info)

    return connectionFromArray(result, args)
  }),
}
