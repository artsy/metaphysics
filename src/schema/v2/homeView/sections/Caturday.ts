import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../HomeViewSection"
import filterArtworksConnection from "schema/v2/filterArtworksConnection"

export const CaturdaySection: HomeViewSection = {
  id: "home-view-section-caturday",
  // featureFlag: "onyx_enable-home-view-section-caturday",

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
