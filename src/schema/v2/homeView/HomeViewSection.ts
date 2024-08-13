import {
  GraphQLFieldConfigMap,
  GraphQLInterfaceType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { InternalIDFields, NodeInterface } from "../object_identification"
import { HomeViewComponent } from "./HomeViewComponent"
import { artworkConnection } from "../artwork"
import { artistsConnection } from "../artists"
import { heroUnitsConnection } from "../HeroUnit/heroUnitsConnection"

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
      type: new GraphQLNonNull(artworkConnection.connectionType),
      args: pageable({}),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : [],
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
      type: new GraphQLNonNull(artistsConnection.type),
      args: pageable({}),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : [],
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
      type: new GraphQLNonNull(heroUnitsConnection.type),
      args: pageable({}),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : [],
    },
  },
})

// the Section union type of all concrete sections

export const HomeViewSectionType = new GraphQLUnionType({
  name: "HomeViewSection",
  types: [
    ArtworksRailHomeViewSectionType,
    ArtistsRailHomeViewSectionType,
    HeroUnitsHomeViewSectionType,
  ],
  resolveType: (value) => {
    return value.type
  },
})
