import {
  GraphQLFieldConfigMap,
  GraphQLInterfaceType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { artistsConnection } from "../artists"
import { artworkConnection } from "../artwork"
import { InternalIDFields, NodeInterface } from "../object_identification"
import { PartnersConnection } from "../partner/partners"
import { HomeViewComponent } from "./HomeViewComponent"

// section interface

const standardSectionFields: GraphQLFieldConfigMap<any, ResolverContext> = {
  ...InternalIDFields,
  component: {
    type: new GraphQLNonNull(HomeViewComponent),
    description: "The component that is prescribed for this section",
  },
}

const GenericHomeViewSectionInterface = new GraphQLInterfaceType({
  name: "GenericHomeViewSection",
  description: "Abstract interface shared by every kind of home view section",
  fields: standardSectionFields,
})

// concrete sections

const HOME_VIEW_SECTION_TYPES = {
  ArtworksRailHomeViewSection: "ArtworksRailHomeViewSection",
  ArtistsRailHomeViewSection: "ArtistsRailHomeViewSection",
  PartnersHomeViewSection: "PartnersHomeViewSection",
} as const

export type HomeViewSectionT = typeof HOME_VIEW_SECTION_TYPES[keyof typeof HOME_VIEW_SECTION_TYPES]

const ArtworksRailHomeViewSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HOME_VIEW_SECTION_TYPES.ArtworksRailHomeViewSection,
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
  name: HOME_VIEW_SECTION_TYPES.ArtistsRailHomeViewSection,
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

export const PartnersHomeViewSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HOME_VIEW_SECTION_TYPES.PartnersHomeViewSection,
  description: "A section containing a list of galleries",
  fields: {
    ...standardSectionFields,

    partnersConnection: {
      type: new GraphQLNonNull(PartnersConnection.type),
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
    ArtworksRailHomeViewSectionType,
    ArtistsRailHomeViewSectionType,
    PartnersHomeViewSectionType,
  ],
  resolveType: (value) => {
    return value.type
  },
})
