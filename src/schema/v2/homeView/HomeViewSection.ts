import {
  GraphQLFieldConfigMap,
  GraphQLID,
  GraphQLInterfaceType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
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
  component: {
    type: HomeViewComponent,
    description: "The component that is prescribed for this section",
  },
}

export const HomeViewSectionTypeNames = {
  HomeViewSectionActivity: "HomeViewSectionActivity",
  HomeViewSectionArticles: "HomeViewSectionArticles",
  HomeViewSectionArtists: "HomeViewSectionArtists",
  HomeViewSectionArtworks: "HomeViewSectionArtworks",
  HomeViewSectionAuctionResults: "HomeViewSectionAuctionResults",
  HomeViewSectionFairs: "HomeViewSectionFairs",
  HomeViewSectionGalleries: "HomeViewSectionGalleries",
  HomeViewSectionGeneric: "HomeViewSectionGeneric",
  HomeViewSectionHeroUnits: "HomeViewSectionHeroUnits",
  HomeViewSectionMarketingCollections: "HomeViewSectionMarketingCollections",
  HomeViewSectionSales: "HomeViewSectionSales",
  HomeViewSectionShows: "HomeViewSectionShows",
  HomeViewSectionViewingRooms: "HomeViewSectionViewingRooms",
} as const

const HomeViewGenericSectionInterface = new GraphQLInterfaceType({
  name: HomeViewSectionTypeNames.HomeViewSectionGeneric,
  description: "Abstract interface shared by every kind of home view section",
  fields: standardSectionFields,
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

// the Section union type of all concrete sections
export const HomeViewSectionType = new GraphQLUnionType({
  name: "HomeViewSection",
  types: [
    HomeViewActivitySectionType,
    HomeViewArticlesSectionType,
    HomeViewArtistsSectionType,
    HomeViewArtworksSectionType,
    HomeViewAuctionResultsSectionType,
    HomeViewFairsSectionType,
    HomeViewGalleriesSectionType,
    HomeViewHeroUnitsSectionType,
    HomeViewMarketingCollectionsSectionType,
    HomeViewSalesSectionType,
    HomeViewShowsSectionType,
    HomeViewViewingRoomsSectionType,
  ],
  resolveType: (value) => {
    return value.type
  },
})
