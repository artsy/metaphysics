import { ResolverContext } from "types/graphql"
import { HomeViewSection } from "schema/v2/homeView/sections"
import { GalleriesNearYou } from "../sections/GalleriesNearYou"
import { Auctions } from "../sections/Auctions"
import { LatestArticles } from "../sections/LatestArticles"
import { News } from "../sections/News"
import { ViewingRooms } from "../sections/ViewingRooms"
import { ShowsForYou } from "../sections/ShowsForYou"
import { MarketingCollections } from "../sections/MarketingCollections"
import { FeaturedFairs } from "../sections/FeaturedFairs"
import { HeroUnits } from "../sections/HeroUnits"
import { TrendingArtists } from "../sections/TrendingArtists"
import { CuratorsPicksEmerging } from "../sections/CuratorsPicksEmerging"

const SECTIONS: HomeViewSection[] = [
  HeroUnits,
  Auctions,
  GalleriesNearYou,
  LatestArticles,
  News,
  CuratorsPicksEmerging,
  MarketingCollections,
  TrendingArtists,
  ViewingRooms,
  ShowsForYou,
  FeaturedFairs,
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
