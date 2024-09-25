import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../HomeViewSection"
import filterArtworksConnection from "schema/v2/filterArtworksConnection"
import { ResolverContext } from "types/graphql"

export const CaturdaySection: HomeViewSection = {
  id: "home-view-section-caturday",

  contextModule: "ContextModule.caturday" as ContextModule,
  ownerType: "OwnerType.caturday" as OwnerType,

  type: HomeViewSectionTypeNames.HomeViewSectionArtworks,

  component: {
    title: "It's Caturday",
    behaviors: {
      viewAll: {
        buttonText: "Browse All Artworks",
      },
    },
  },

  requiresAuthentication: false,

  shouldBeDisplayed: (_context: ResolverContext) => {
    const isSaturday = new Date().getDay() === 6
    return isSaturday
  },

  resolver: withHomeViewTimeout(async (parent, args, context, info) => {
    const loader = filterArtworksConnection()
    if (!loader?.resolve) return
    const finalArgs = {
      ...args,
      tagID: "cat",
    }
    const result = await loader.resolve(parent, finalArgs, context, info)
    return result
  }),
}
