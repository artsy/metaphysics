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
  ActivityHomeViewSection: "ActivityHomeViewSection",
  ArticlesHomeViewSection: "ArticlesHomeViewSection",
  ArtistsHomeViewSection: "ArtistsHomeViewSection",
  ArtworksHomeViewSection: "ArtworksHomeViewSection",
  AuctionResultsHomeViewSection: "AuctionResultsHomeViewSection",
  FairsHomeViewSection: "FairsHomeViewSection",
  GalleriesHomeViewSection: "GalleriesHomeViewSection",
  GenericHomeViewSection: "GenericHomeViewSection",
  HeroUnitsHomeViewSection: "HeroUnitsHomeViewSection",
  MarketingCollectionsHomeViewSection: "MarketingCollectionsHomeViewSection",
  SalesHomeViewSection: "SalesHomeViewSection",
  ShowsHomeViewSection: "ShowsHomeViewSection",
  ViewingRoomsHomeViewSection: "ViewingRoomsHomeViewSection",
} as const

const GenericHomeViewSectionInterface = new GraphQLInterfaceType({
  name: HomeViewSectionTypeNames.GenericHomeViewSection,
  description: "Abstract interface shared by every kind of home view section",
  fields: standardSectionFields,
})

// concrete sections

const ArtworksHomeViewSectionType = new GraphQLObjectType<any, ResolverContext>(
  {
    name: HomeViewSectionTypeNames.ArtworksHomeViewSection,
    description: "An artworks section in the home view",
    interfaces: [GenericHomeViewSectionInterface, NodeInterface],
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

const ArtistsHomeViewSectionType = new GraphQLObjectType<any, ResolverContext>({
  name: HomeViewSectionTypeNames.ArtistsHomeViewSection,
  description: "An artists section in the home view",
  interfaces: [GenericHomeViewSectionInterface, NodeInterface],
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

const HeroUnitsHomeViewSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HeroUnitsHomeViewSection,
  description: "A hero units section in the home view",
  interfaces: [GenericHomeViewSectionInterface, NodeInterface],
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

const FairsHomeViewSectionType = new GraphQLObjectType<any, ResolverContext>({
  name: HomeViewSectionTypeNames.FairsHomeViewSection,
  description: "A fairs section in the home view",
  interfaces: [GenericHomeViewSectionInterface, NodeInterface],
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

const ArticlesHomeViewSectionType = new GraphQLObjectType<any, ResolverContext>(
  {
    name: HomeViewSectionTypeNames.ArticlesHomeViewSection,
    description: "An articles section in the home view",
    interfaces: [GenericHomeViewSectionInterface, NodeInterface],
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

const MarketingCollectionsHomeViewSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.MarketingCollectionsHomeViewSection,
  description: "A marketing collections section in the home view",
  interfaces: [GenericHomeViewSectionInterface, NodeInterface],
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

const ShowsHomeViewSectionType = new GraphQLObjectType<any, ResolverContext>({
  name: HomeViewSectionTypeNames.ShowsHomeViewSection,
  description: "A shows section in the home view",
  interfaces: [GenericHomeViewSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,
  },
})

export const ViewingRoomsHomeViewSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.ViewingRoomsHomeViewSection,
  description: "A viewing rooms section in the home view",
  interfaces: [GenericHomeViewSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,
  },
})

const ActivityHomeViewSectionType = new GraphQLObjectType<any, ResolverContext>(
  {
    name: HomeViewSectionTypeNames.ActivityHomeViewSection,
    description: "A user activity section in the home view",
    interfaces: [GenericHomeViewSectionInterface, NodeInterface],
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

export const AuctionResultsHomeViewSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.AuctionResultsHomeViewSection,
  description: "An auction results section in the home view",
  interfaces: [GenericHomeViewSectionInterface, NodeInterface],
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

const SalesHomeViewSectionType = new GraphQLObjectType<any, ResolverContext>({
  name: HomeViewSectionTypeNames.SalesHomeViewSection,
  description: "A sales (auctions) section in the home view",
  interfaces: [GenericHomeViewSectionInterface, NodeInterface],
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

export const GalleriesHomeViewSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.GalleriesHomeViewSection,
  description: "A section containing a list of galleries",
  interfaces: [GenericHomeViewSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,
  },
})

// the Section union type of all concrete sections
export const HomeViewSectionType = new GraphQLUnionType({
  name: "HomeViewSection",
  types: [
    ActivityHomeViewSectionType,
    ArticlesHomeViewSectionType,
    ArtistsHomeViewSectionType,
    ArtworksHomeViewSectionType,
    AuctionResultsHomeViewSectionType,
    FairsHomeViewSectionType,
    GalleriesHomeViewSectionType,
    HeroUnitsHomeViewSectionType,
    MarketingCollectionsHomeViewSectionType,
    SalesHomeViewSectionType,
    ShowsHomeViewSectionType,
    ViewingRoomsHomeViewSectionType,
  ],
  resolveType: (value) => {
    return value.type
  },
})
