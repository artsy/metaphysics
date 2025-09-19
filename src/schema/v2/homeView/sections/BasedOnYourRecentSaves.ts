import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { map } from "lodash"
import { paginationResolver } from "schema/v2/fields/pagination"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"

const SAVED_ARTWORKS_SIZE = 3
const SIMILAR_ARTWORKS_SIZE = 10
const TIMEOUT_MS = 6000

export const BasedOnYourRecentSaves: HomeViewSection = {
  id: "home-view-section-based-on-your-recent-saves",
  type: HomeViewSectionTypeNames.HomeViewSectionArtworks,
  contextModule: ContextModule.basedOnYourRecentSavesRail,
  component: {
    title: "Inspired by Your Saved Artworks",
  },
  ownerType: OwnerType.basedOnYourRecentSaves,
  requiresAuthentication: true,
  resolver: withHomeViewTimeout(
    async (
      _parent,
      args,
      { savedArtworksLoader, userID, similarArtworksLoader },
      _info
    ) => {
      if (!savedArtworksLoader || !userID) return null

      const gravityArgs = convertConnectionArgsToGravityArgs(args)
      const { page, size, offset } = gravityArgs

      const { body: works } = await savedArtworksLoader({
        size: SAVED_ARTWORKS_SIZE,
        sort: "-position",
        user_id: userID,
        private: true,
      })

      if (works.length === 0) return null

      const artworks = await similarArtworksLoader({
        artwork_id: map(works, "_id"),
        for_sale: true,
        size: size || SIMILAR_ARTWORKS_SIZE,
        offset,
        total_count: true,
      })

      return paginationResolver({
        totalCount: artworks.length,
        offset,
        page,
        size,
        body: artworks,
        args,
      })
    },
    TIMEOUT_MS
  ),
}
