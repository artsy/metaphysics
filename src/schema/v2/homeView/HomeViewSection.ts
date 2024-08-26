import {
  GraphQLFieldConfigMap,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import ArticlesConnection from "../articlesConnection"
import { artistsConnection } from "../artists"
import { artworkConnection } from "../artwork"
import { fairsConnection } from "../fairs"
import { connectionWithCursorInfo, emptyConnection } from "../fields/pagination"
import { heroUnitsConnection } from "../HeroUnit/heroUnitsConnection"
import { MarketingCollectionType } from "../marketingCollections"
import { NotificationsConnection } from "../notifications"
import { InternalIDFields, NodeInterface } from "../object_identification"
import { HomeViewComponent } from "./HomeViewComponent"

// section interface

const standardSectionFields: GraphQLFieldConfigMap<any, ResolverContext> = {
  ...InternalIDFields,
  component: {
    type: HomeViewComponent,
    description: "The component that is prescribed for this section",
  },
}

const GenericHomeViewSectionInterface = new GraphQLInterfaceType({
  name: "GenericHomeViewSection",
  description: "Abstract interface shared by every kind of home view section",
  fields: standardSectionFields,
})

// concrete sections

const ArtworksRailHomeViewSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArtworksRailHomeViewSection",
  description: "An artwork rail section in the home view",
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
})

const ArtistsRailHomeViewSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArtistsRailHomeViewSection",
  description: "An artists rail section in the home view",
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
  name: "HeroUnitsHomeViewSection",
  description: "Hero units rail section",
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

const FairsRailHomeViewSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "FairsRailHomeViewSection",
  description: "Fairs rail section",
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

const ArticlesRailHomeViewSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArticlesRailHomeViewSection",
  description: "An articles rail section in the home view",
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
})

const MarketingCollectionsRailHomeViewSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "MarketingCollectionsRailHomeViewSection",
  description: "A marketing collections rail section in the home view",
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

const ShowsRailHomeViewSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ShowsRailHomeViewSection",
  description: "A shows rail section in the home view",
  interfaces: [GenericHomeViewSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,
  },
})

export const ViewingRoomsRailHomeViewSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ViewingRoomsRailHomeViewSection",
  description: "A viewing rooms rail section in the home view",
  interfaces: [GenericHomeViewSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,
  },
})

const ActivityRailHomeViewSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ActivityRailHomeViewSection",
  description: "An rail to show a list of user activity",
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
})

// the Section union type of all concrete sections

export const HomeViewSectionType = new GraphQLUnionType({
  name: "HomeViewSection",
  types: [
    ArticlesRailHomeViewSectionType,
    ArtistsRailHomeViewSectionType,
    ArtworksRailHomeViewSectionType,
    FairsRailHomeViewSectionType,
    HeroUnitsHomeViewSectionType,
    MarketingCollectionsRailHomeViewSectionType,
    ShowsRailHomeViewSectionType,
    ViewingRoomsRailHomeViewSectionType,
    ActivityRailHomeViewSectionType,
  ],
  resolveType: (value) => {
    return value.type
  },
})
