import { ContextModule, OwnerType } from "@artsy/cohesion"
import { ResolverContext } from "types/graphql"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { filterArtworksConnectionWithParams } from "schema/v2/filterArtworksConnection"

export const CuratorsPicksEmerging: HomeViewSection = {
  id: "home-view-section-curators-picks-emerging",
  type: HomeViewSectionTypeNames.HomeViewSectionArtworks,
  contextModule: ContextModule.curatorsPicksEmergingRail,
  component: {
    type: "FeaturedCollection",
    title: async (context: ResolverContext) => {
      const { app_title } = await context.siteHeroUnitLoader(
        "curators-picks-emerging-app"
      )
      return app_title
    },
    description: async (context: ResolverContext) => {
      const { app_description } = await context.siteHeroUnitLoader(
        "curators-picks-emerging-app"
      )
      return app_description
    },
    backgroundImageURL: async (context: ResolverContext, args) => {
      const {
        background_image_app_phone_url,
        background_image_app_tablet_url,
      } = await context.siteHeroUnitLoader("curators-picks-emerging-app")

      if (args.version === "wide") {
        return background_image_app_tablet_url
      }

      return background_image_app_phone_url
    },
    behaviors: {
      viewAll: {
        href: "/collection/curators-picks-emerging",
        buttonText: "Browse All Artworks",
        ownerType: OwnerType.collection,
      },
    },
  },
  requiresAuthentication: false,

  resolver: withHomeViewTimeout(async (parent, args, context, info) => {
    const loader = filterArtworksConnectionWithParams((_args) => {
      return {
        marketing_collection_id: "curators-picks-emerging",
        sort: "-decayed_merch",
      }
    })

    if (!loader?.resolve) {
      return
    }

    const result = await loader.resolve(parent, args, context, info)

    return result
  }),
}
