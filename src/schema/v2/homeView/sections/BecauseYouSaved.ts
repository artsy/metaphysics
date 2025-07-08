import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { map } from "lodash"
import { connectionFromArray } from "graphql-relay"
import { ResolverContext } from "types/graphql"

const SAVED_ARTWORKS_SIZE = 1
const SIMILAR_ARTWORKS_SIZE = 10

export const BecauseYouSaved: HomeViewSection = {
  id: "home-view-section-because-you-saved",
  type: HomeViewSectionTypeNames.HomeViewSectionArtworks,
  featureFlag: "onyx_based_on_your_saves_home_view_section",
  contextModule: ContextModule.artworkRecommendationsRail, // TODO: add becauseYouSavedRail context module
  component: {
    title: async (context: ResolverContext) => {
      const { savedArtworksLoader, userID } = context

      if (!savedArtworksLoader || !userID) return ""

      const { body: works } = await savedArtworksLoader({
        size: SAVED_ARTWORKS_SIZE,
        sort: "-position",
        user_id: userID,
        private: true,
      })

      if (works.length === 0) return ""

      const work = works[0]
      return `Because You Saved ${work.title} by ${work.artist.name}`
    },
  },
  ownerType: OwnerType.artworkRecommendations, // TODO: add owner type
  requiresAuthentication: true,
  resolver: withHomeViewTimeout(
    async (
      _parent,
      args,
      { savedArtworksLoader, userID, similarArtworksLoader },
      _info
    ) => {
      if (!savedArtworksLoader || !userID) return null

      const { body: works } = await savedArtworksLoader({
        size: SAVED_ARTWORKS_SIZE,
        sort: "-position",
        user_id: userID,
        private: true,
      })

      if (works.length === 0) return null

      const similarArtworks = await similarArtworksLoader({
        artwork_id: map(works, "_id"),
        for_sale: true,
        size: SIMILAR_ARTWORKS_SIZE,
      })

      return {
        totalCount: similarArtworks.length,
        ...connectionFromArray(similarArtworks, args),
      }
    }
  ),
}
