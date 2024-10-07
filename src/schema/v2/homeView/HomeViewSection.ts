import {
  GraphQLFieldConfigMap,
  GraphQLID,
  GraphQLInterfaceType,
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
import { InternalIDFields, NodeInterface } from "../object_identification"
import { SalesConnectionField } from "../sales"
import { HomeViewComponent } from "./HomeViewComponent"
import { toGlobalId } from "graphql-relay"
import { FeaturedLinkConnectionType } from "../FeaturedLink/featuredLink"
import { ImageType } from "../image"
import { HomeViewCardConnectionType } from "./HomeViewCard"

// section interface

const standardSectionFields: GraphQLFieldConfigMap<any, ResolverContext> = {
  ...InternalIDFields,
  id: {
    type: new GraphQLNonNull(GraphQLID),
    description: "A globally unique ID.",
    resolve: ({ id }) => {
      return toGlobalId("HomeViewSection", id)
    },
  },
  contextModule: {
    type: GraphQLString,
    description:
      "[Analytics] `context module` analytics value for this section, as defined in our schema (artsy/cohesion)",
  },
  component: {
    type: HomeViewComponent,
    description:
      "Component prescription for this section, for overriding or customizing presentation and behavior",
  },
  ownerType: {
    type: GraphQLString,
    description:
      "[Analytics] `owner type` analytics value for this scetion when displayed in a standalone UI, as defined in our schema (artsy/cohesion)",
  },
}

export const HomeViewSectionTypeNames = {
  HomeViewSectionActivity: "HomeViewSectionActivity",
  HomeViewSectionArticles: "HomeViewSectionArticles",
  HomeViewSectionArtists: "HomeViewSectionArtists",
  HomeViewSectionArtworks: "HomeViewSectionArtworks",
  HomeViewSectionAuctionResults: "HomeViewSectionAuctionResults",
  HomeViewSectionCards: "HomeViewSectionCards",
  HomeViewSectionDiscoverMarketingCollections:
    "HomeViewSectionDiscoverMarketingCollections",
  HomeViewSectionFairs: "HomeViewSectionFairs",
  HomeViewSectionGalleries: "HomeViewSectionGalleries",
  HomeViewSectionGeneric: "HomeViewSectionGeneric",
  HomeViewSectionHeroUnits: "HomeViewSectionHeroUnits",
  HomeViewSectionExploreByMarketingCollectionCategories:
    "HomeViewSectionExploreByMarketingCollectionCategories",
  HomeViewSectionMarketingCollections: "HomeViewSectionMarketingCollections",
  HomeViewSectionSales: "HomeViewSectionSales",
  HomeViewSectionShows: "HomeViewSectionShows",
  HomeViewSectionViewingRooms: "HomeViewSectionViewingRooms",
} as const

export const HomeViewGenericSectionInterface = new GraphQLInterfaceType({
  name: HomeViewSectionTypeNames.HomeViewSectionGeneric,
  description: "Abstract interface shared by every kind of home view section",
  fields: standardSectionFields,
  resolveType: (value) => {
    return value.type
  },
})

// concrete sections

const HomeViewArtworksSectionType = new GraphQLObjectType<any, ResolverContext>(
  {
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
  }
)

const HomeViewArtistsSectionType = new GraphQLObjectType<any, ResolverContext>({
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

const HomeViewHeroUnitsSectionType = new GraphQLObjectType<
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

const HomeViewFairsSectionType = new GraphQLObjectType<any, ResolverContext>({
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

const HomeViewArticlesSectionType = new GraphQLObjectType<any, ResolverContext>(
  {
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
  }
)

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

const HomeViewExploreBySectionType = new GraphQLObjectType<
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

const HomeViewMarketingCollectionsSectionType = new GraphQLObjectType<
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

const HomeViewShowsSectionType = new GraphQLObjectType<any, ResolverContext>({
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

const HomeViewActivitySectionType = new GraphQLObjectType<any, ResolverContext>(
  {
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
  }
)

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

const HomeViewSalesSectionType = new GraphQLObjectType<any, ResolverContext>({
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

export const homeViewSectionTypes: GraphQLObjectType<any, ResolverContext>[] = [
  HomeViewActivitySectionType,
  HomeViewArticlesSectionType,
  HomeViewArtistsSectionType,
  HomeViewArtworksSectionType,
  HomeViewAuctionResultsSectionType,
  HomeViewCardsSectionType,
  HomeViewFairsSectionType,
  HomeViewGalleriesSectionType,
  HomeViewHeroUnitsSectionType,
  HomeViewExploreBySectionType,
  HomeViewMarketingCollectionsSectionType,
  HomeViewSalesSectionType,
  HomeViewShowsSectionType,
  HomeViewViewingRoomsSectionType,
  HomeViewDiscoverMarketingCollectionType,
]
