import {
  GraphQLObjectType,
  GraphQLFieldConfig,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLEnumType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { STUB_SECTIONS } from "./stubData"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "../fields/pagination"
import { pageable } from "relay-cursor-paging"
import { InternalIDFields, NodeInterface } from "../object_identification"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"

// known standard component types

const ComponentTypeType = new GraphQLEnumType({
  name: "ComponentType",
  description: "Known component types for use in home view",
  values: {
    ARTWORKS_RAIL: {
      value: "artworks_rail",
      description: "A standard rail of artworks",
    },
    ARTISTS_RAIL: {
      value: "artists_rail",
      description: "A standard rail of artists",
    },
  },
})

// a component spec, to be prescribed by each section

const Component = new GraphQLObjectType({
  name: "Component",
  description: "A component specification",
  fields: {
    type: {
      type: ComponentTypeType,
      description: "Which component type to render",
    },
  },
})

// section interface

const GenericSectionInterface = new GraphQLInterfaceType({
  name: "GenericSection",
  description: "Abstract interface shared by every kind of home view section",
  fields: {
    ...InternalIDFields,
    key: {
      type: GraphQLNonNull(GraphQLString),
      description: "A stable identifier for this section",
    },
    title: {
      type: GraphQLNonNull(GraphQLString),
      description: "A display title for this section",
    },
    component: {
      type: Component,
      description: "The component that is prescribed for this section",
    },
  },
})

// concrete sections

const ArtworksRailSectionType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtworksRailSection",
  description: "An artwork rail section in the home view",
  interfaces: [GenericSectionInterface, NodeInterface],
  fields: {
    ...InternalIDFields,
    key: {
      type: GraphQLNonNull(GraphQLString),
      description: "A stable identifier for this section",
    },
    title: {
      type: GraphQLNonNull(GraphQLString),
      description: "A display title for this section",
    },
    component: {
      type: Component,
      description: "The component that is prescribed for this section",
    },
  },
  isTypeOf: (value) => {
    return value.component.type === "artworks_rail"
  },
})

const ArtistsRailSectionType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtistsRailSection",
  description: "An artists rail section in the home view",
  interfaces: [GenericSectionInterface, NodeInterface],
  fields: {
    ...InternalIDFields,
    key: {
      type: GraphQLNonNull(GraphQLString),
      description: "A stable identifier for this section",
    },
    title: {
      type: GraphQLNonNull(GraphQLString),
      description: "A display title for this section",
    },
    component: {
      type: Component,
      description: "The component that is prescribed for this section",
    },
  },
  isTypeOf: (value) => {
    return value.component.type === "artists_rail"
  },
})

// the Section union type of all concrete sections

const SectionType = new GraphQLUnionType({
  name: "Section",
  types: [ArtworksRailSectionType, ArtistsRailSectionType],
})

const SectionsConnectionType = connectionWithCursorInfo({
  nodeType: SectionType,
}).connectionType

const SectionConnection: GraphQLFieldConfig<any, ResolverContext> = {
  type: SectionsConnectionType,
  args: pageable({}),
  resolve: async (_parent, args, _context, _info) => {
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const totalCount = STUB_SECTIONS.length
    const data = STUB_SECTIONS.slice(offset, offset + size)

    return paginationResolver({
      totalCount,
      offset,
      page,
      size,
      body: data,
      args,
    })
  },
}

// root homeView field

const HomeViewType = new GraphQLObjectType<any, ResolverContext>({
  name: "HomeView",
  description: "Experimental schema for new home view",
  fields: {
    sectionsConnection: SectionConnection,
  },
})

export const HomeView: GraphQLFieldConfig<void, ResolverContext> = {
  type: GraphQLNonNull(HomeViewType),
  description: "Home view content",
  resolve: () => {
    // dummy response object, otherwise the nested fields won’t work
    return {}
  },
}
