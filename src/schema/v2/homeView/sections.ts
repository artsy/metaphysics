import { GraphQLFieldResolver } from "graphql"
import { ResolverContext } from "types/graphql"
import {
  AuctionLotsForYouResolver,
  NewWorksForYouResolver,
  NewWorksFromGalleriesYouFollowResolver,
  RecentlyViewedArtworksResolver,
  SimilarToRecentlyViewedArtworksResolver,
} from "./artworkResolvers"
import {
  RecommendedArtistsResolver,
  SuggestedArtistsResolver,
} from "./artistResolvers"
import { HeroUnitsResolver } from "./heroUnitsResolver"
import { featuredCollectionArtworksResolver } from "./featuredCollectionArtworksResolver"

export type HomeViewSectionOrResolver =
  | HomeViewSection
  | HomeViewSectionResolver

export type HomeViewSection = {
  id: string
  type: string
  component?: {
    title?: string | null
    subtitle?: string | null
    backgroundColor?: string | null
  } | null
  resolver?: GraphQLFieldResolver<any, ResolverContext>
}

export type HomeViewSectionResolver = (
  context: ResolverContext
) => Promise<HomeViewSection>

export const SimilarToRecentlyViewedArtworks: HomeViewSection = {
  id: "home-view-section-similar-to-recently-viewed-artworks",
  type: "ArtworksRailHomeViewSection",
  component: {
    title: "Similar to Works You’ve Viewed",
  },
  resolver: SimilarToRecentlyViewedArtworksResolver,
}
export const RecentlyViewedArtworks: HomeViewSection = {
  id: "home-view-section-recently-viewed-artworks",
  type: "ArtworksRailHomeViewSection",
  component: {
    title: "Recently viewed works",
  },
  resolver: RecentlyViewedArtworksResolver,
}

export const AuctionLotsForYou: HomeViewSection = {
  id: "home-view-section-auction-lots-for-you",
  type: "ArtworksRailHomeViewSection",
  component: {
    title: "Auction lots for you",
  },
  resolver: AuctionLotsForYouResolver,
}

export const NewWorksForYou: HomeViewSection = {
  id: "home-view-section-new-works-for-you",
  type: "ArtworksRailHomeViewSection",
  component: {
    title: "New works for you",
  },
  resolver: NewWorksForYouResolver,
}

export const NewWorksFromGalleriesYouFollow: HomeViewSection = {
  id: "home-view-section-new-works-from-galleries-you-follow",
  type: "ArtworksRailHomeViewSection",
  component: {
    title: "New Works from Galleries You Follow",
  },
  resolver: NewWorksFromGalleriesYouFollowResolver,
}

// Artists Rails

export const TrendingArtists: HomeViewSection = {
  id: "home-view-section-trending-artists",
  type: "ArtistsRailHomeViewSection",
  component: {
    title: "Trending Artists on Artsy",
  },
  resolver: SuggestedArtistsResolver,
}

export const RecommendedArtists: HomeViewSection = {
  id: "home-view-section-recommended-artists",
  type: "ArtistsRailHomeViewSection",
  component: {
    title: "Recommended Artists",
  },
  resolver: RecommendedArtistsResolver,
}

export const HeroUnits: HomeViewSection = {
  id: "home-view-section-hero-units",
  type: "HeroUnitsHomeViewSection",
  resolver: HeroUnitsResolver,
}

export const featuredCollection = (
  heroUnitID,
  marketingCollectionID
): HomeViewSectionResolver => {
  return async (context: ResolverContext): Promise<HomeViewSection> => {
    const { siteHeroUnitLoader } = context

    const heroUnit = await siteHeroUnitLoader(heroUnitID)

    return {
      id: `home-view-section-featured-collection-${heroUnitID}`,
      type: "FeaturedCollectionHomeViewSection",
      component: {
        title: heroUnit.app_title,
        subtitle: heroUnit.app_description,
        backgroundColor: "black100",
      },
      resolver: featuredCollectionArtworksResolver(marketingCollectionID),
    }
  }
}

const sections: HomeViewSectionOrResolver[] = [
  AuctionLotsForYou,
  HeroUnits,
  NewWorksForYou,
  NewWorksFromGalleriesYouFollow,
  RecentlyViewedArtworks,
  RecommendedArtists,
  SimilarToRecentlyViewedArtworks,
  TrendingArtists,
  featuredCollection("curators-picks-emerging-app", "curators-picks-emerging"),
]

export const registry = async (context: ResolverContext) => {
  return sections.reduce(async (acc, section) => {
    if (typeof section === "function") {
      section = await section(context)
    }

    return { ...acc, [section.id]: section }
  }, {})
}
