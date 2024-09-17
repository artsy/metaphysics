import { ContextModule } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../HomeViewSection"
import { connectionFromArray } from "graphql-relay"
import { getCuratedArtists } from "schema/v2/artists/curatedTrending"

export const TrendingArtists: HomeViewSection = {
  id: "home-view-section-trending-artists",
  type: HomeViewSectionTypeNames.HomeViewSectionArtists,
  contextModule: ContextModule.trendingArtistsRail,
  component: {
    title: "Trending Artists",
  },
  requiresAuthentication: false,

  resolver: withHomeViewTimeout(async (_parent, args, context, _info) => {
    const artistRecords = await getCuratedArtists(context)
    return connectionFromArray(artistRecords, args)
  }),
}
