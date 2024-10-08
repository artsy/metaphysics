import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import ArticlesConnection from "../articlesConnection"
import { artistsConnection } from "../artists"
import { artworkConnection } from "../artwork"
import { auctionResultConnection } from "../auction_result"
import { fairsConnection } from "../fairs"
import { connectionWithCursorInfo, emptyConnection } from "../fields/pagination"
import { heroUnitsConnection } from "../HeroUnit/heroUnitsConnection"
import { MarketingCollectionType } from "../marketingCollections"
import { NotificationsConnection } from "../notifications"
import { NodeInterface } from "../object_identification"
import { SalesConnectionField } from "../sales"
import { FeaturedLinkConnectionType } from "../FeaturedLink/featuredLink"
import { ImageType } from "../image"
import { HomeViewCardConnectionType } from "./HomeViewCard"
import { HomeViewSectionTypeNames } from "./HomeViewSectionTypeNames"
import { standardSectionFields } from "./standardSectionFields"
import { HomeViewGenericSectionInterface } from "./HomeViewGenericSectionInterface"

// concrete sections

export const HomeViewArtworksSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionArtworks,
  description: "An artworks section in the home view",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,

    artworksConnection: {
      type: artworkConnection.connectionType,
      args: pageable({}),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : emptyConnection,
    },
  },
})

export const HomeViewArtistsSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionArtists,
  description: "An artists section in the home view",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,

    artistsConnection: {
      type: artistsConnection.type,
      args: pageable({}),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : emptyConnection,
    },
  },
})

export const HomeViewHeroUnitsSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionHeroUnits,
  description: "A hero units section in the home view",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,

    heroUnitsConnection: {
      type: heroUnitsConnection.type,
      args: pageable({}),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : emptyConnection,
    },
  },
})

export const HomeViewFairsSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionFairs,
  description: "A fairs section in the home view",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,

    fairsConnection: {
      type: fairsConnection.type,
      args: pageable({}),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : [],
    },
  },
})

export const HomeViewArticlesSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionArticles,
  description: "An articles section in the home view",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,

    articlesConnection: {
      type: ArticlesConnection.type,
      args: pageable({}),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : [],
    },
  },
})

const ExploreByMarketingCollectionCategory = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ExploreByMarketingCollectionCategory",
  description:
    "[deprecated in favor of `HomeViewCard`] A marketing collection category to explore by",
  fields: () => ({
    href: {
      type: GraphQLNonNull(GraphQLString),
    },
    name: {
      type: GraphQLNonNull(GraphQLString),
    },
    image: {
      type: ImageType,
      resolve: ({ image }) => {
        const { image_url } = image
        return {
          image_url,
          original_width: 180,
          original_height: 180,
          quality: 80,
        }
      },
    },
  }),
})

export const HomeViewExploreBySectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name:
    HomeViewSectionTypeNames.HomeViewSectionExploreByMarketingCollectionCategories,
  description:
    "[deprecated in favor of `HomeViewSectionCards`] Marketing Collection Categories section in the home view",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,

    categories: {
      type: GraphQLNonNull(
        GraphQLList(GraphQLNonNull(ExploreByMarketingCollectionCategory))
      ),
      resolve: (parent, ...rest) => {
        return parent.resolver ? parent.resolver(parent, ...rest) : []
      },
    },
  },
})

export const HomeViewMarketingCollectionsSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionMarketingCollections,
  description: "A marketing collections section in the home view",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,

    marketingCollectionsConnection: {
      type: connectionWithCursorInfo({
        nodeType: MarketingCollectionType,
      }).connectionType,
      args: pageable({}),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : [],
    },
  },
})

export const HomeViewShowsSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionShows,
  description: "A shows section in the home view",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,
  },
})

export const HomeViewViewingRoomsSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionViewingRooms,
  description: "A viewing rooms section in the home view",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,
  },
})

export const HomeViewActivitySectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionActivity,
  description: "A user activity section in the home view",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,

    notificationsConnection: {
      type: NotificationsConnection.type,

      args: pageable({}),
      resolve: (parent, ...rest) => {
        return parent.resolver ? parent.resolver(parent, ...rest) : []
      },
    },
  },
})

export const HomeViewAuctionResultsSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionAuctionResults,
  description: "An auction results section in the home view",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,

    auctionResultsConnection: {
      type: auctionResultConnection.connectionType,
      args: pageable({}),
      resolve: (parent, ...rest) => {
        return parent.resolver ? parent.resolver(parent, ...rest) : []
      },
    },
  },
})

export const HomeViewSalesSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionSales,
  description: "A sales (auctions) section in the home view",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,

    salesConnection: {
      type: SalesConnectionField.type,
      args: pageable({}),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : [],
    },
  },
})

export const HomeViewGalleriesSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionGalleries,
  description: "A section containing a list of galleries",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,
  },
})

export const HomeViewDiscoverMarketingCollectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionDiscoverMarketingCollections,
  description:
    "[deprecated in favor of `HomeViewSectionCards`] A section containing a list of curated marketing collections",

  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,
    linksConnection: {
      type: FeaturedLinkConnectionType,
      args: pageable({}),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : emptyConnection,
    },
  },
})

export const HomeViewCardsSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionCards,
  description: "A section containing a list of navigation cards",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,
    cardsConnection: {
      type: HomeViewCardConnectionType,
      args: pageable({}),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : emptyConnection,
    },
  },
})
