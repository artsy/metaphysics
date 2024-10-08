import { ContextModule } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../HomeViewSectionTypeNames"
import { connectionFromArray } from "graphql-relay"

export const ActiveBids: HomeViewSection = {
  id: "home-view-section-active-bids",
  type: HomeViewSectionTypeNames.HomeViewSectionArtworks,
  contextModule: ContextModule.yourActiveBids,
  component: {
    title: "Your Active Bids",
  },
  requiresAuthentication: true,

  resolver: withHomeViewTimeout(async (_parent, args, context, _info) => {
    const { lotStandingLoader } = context

    if (!lotStandingLoader) return []

    let result = await lotStandingLoader({
      live: true,
    })
    result = result.map((res) => res.sale_artwork.artwork)

    return connectionFromArray(result, args)
  }),
}
