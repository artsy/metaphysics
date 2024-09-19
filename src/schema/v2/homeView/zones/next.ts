import { ActiveBids } from "../sections/ActiveBids"
import { AuctionLotsForYou } from "../sections/AuctionLotsForYou"
import { HomeViewSection } from "schema/v2/homeView/sections"
import { LatestActivity } from "../sections/LatestActivity"
import { LatestAuctionResults } from "../sections/LatestAuctionResults"
import { NewWorksForYou } from "../sections/NewWorksForYou"
import { NewWorksFromGalleriesYouFollow } from "../sections/NewWorksFromGalleriesYouFollow"
import { RecentlyViewedArtworks } from "../sections/RecentlyViewedArtworks"
import { RecommendedArtists } from "../sections/RecommendedArtists"
import { RecommendedArtworks } from "../sections/RecommendedArtworks"
import { ResolverContext } from "types/graphql"
import { SimilarToRecentlyViewedArtworks } from "../sections/SimilarToRecentlyViewedArtworks"
import { ShowsForYou } from "../sections/ShowsForYou"

const SECTIONS: HomeViewSection[] = [
  LatestActivity,
  NewWorksForYou,
  ActiveBids,
  AuctionLotsForYou,
  LatestAuctionResults,
  RecommendedArtworks,
  NewWorksFromGalleriesYouFollow,
  RecommendedArtists,
  RecentlyViewedArtworks,
  SimilarToRecentlyViewedArtworks,
  ShowsForYou,
]

export async function getSections(context: ResolverContext) {
  const isAuthenticatedUser = !!context.accessToken

  const displayableSections = SECTIONS.reduce((sections, section) => {
    const isDisplayable =
      section.requiresAuthentication === false || // public content, or
      (section.requiresAuthentication && isAuthenticatedUser) // user-specific content

    if (isDisplayable) sections.push(section)
    return sections
  }, [] as HomeViewSection[])

  return displayableSections
}
