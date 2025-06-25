import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { map } from "lodash"
import { connectionFromArray } from "graphql-relay"

const SAVED_ARTWORKS_SIZE = 1
const SIMILAR_ARTWORKS_SIZE = 10

export const BasedOnYourRecentSaves: HomeViewSection = {
  id: "home-view-section-based-on-your-recent-saves",
  type: HomeViewSectionTypeNames.HomeViewSectionArtworks,
  featureFlag: "onyx_based_on_your_saves_home_view_section",
  contextModule: ContextModule.artworkRecommendationsRail, // TODO: add basedOnYourRecentSavesRail context module
  component: {
    title: "Based on Your Recent Saves",
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
