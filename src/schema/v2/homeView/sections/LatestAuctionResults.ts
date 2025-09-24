import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import {
  AuctionResultSortEnum,
  AuctionResultsStateEnums,
} from "schema/v2/auction_result"
import AuctionResultsByFollowedArtists from "schema/v2/me/auctionResultsByFollowedArtists"
import { shouldDisplayAuctionsHub } from "./AuctionsHub"

export const LatestAuctionResults: HomeViewSection = {
  id: "home-view-section-latest-auction-results",
  type: HomeViewSectionTypeNames.HomeViewSectionAuctionResults,
  contextModule: ContextModule.auctionResultsRail,
  component: {
    title: "Auction Results for Artists You Follow",
    behaviors: {
      viewAll: {
        buttonText: "Browse All Results",
      },
    },
  },
  ownerType: OwnerType.auctionResultsForArtistsYouFollow,
  requiresAuthentication: true,
  shouldBeDisplayed: (context) => {
    return !shouldDisplayAuctionsHub(context)
  },

  resolver: withHomeViewTimeout(async (parent, args, context, info) => {
    const finalArgs = {
      state: AuctionResultsStateEnums.getValue("PAST")?.value,
      sort: AuctionResultSortEnum.getValue("DATE_DESC")?.value,
      ...args,
    }

    return await AuctionResultsByFollowedArtists.resolve!(
      parent,
      finalArgs,
      context,
      info
    )
  }),
}
