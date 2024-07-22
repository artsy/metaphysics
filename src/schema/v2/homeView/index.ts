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

const HomeViewComponentTypeType = new GraphQLEnumType({
  name: "HomeViewComponentType",
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

const HomeViewComponent = new GraphQLObjectType({
  name: "HomeViewComponent",
  description: "A component specification",
  fields: {
    type: {
      type: HomeViewComponentTypeType,
      description: "Which component type to render",
    },
  },
})

// section interface

const GenericHomeViewSectionInterface = new GraphQLInterfaceType({
  name: "GenericHomeViewSection",
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
      type: HomeViewComponent,
      description: "The component that is prescribed for this section",
    },
  },
})

// concrete sections

const ArtworksRailSectionType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtworksRailSection",
  description: "An artwork rail section in the home view",
  interfaces: [GenericHomeViewSectionInterface, NodeInterface],
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
      type: HomeViewComponent,
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
  interfaces: [GenericHomeViewSectionInterface, NodeInterface],
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
      type: HomeViewComponent,
      description: "The component that is prescribed for this section",
    },
  },
  isTypeOf: (value) => {
    return value.component.type === "artists_rail"
  },
})

// the Section union type of all concrete sections

const HomeViewSectionType = new GraphQLUnionType({
  name: "HomeViewSection",
  types: [ArtworksRailSectionType, ArtistsRailSectionType],
})

const SectionsConnectionType = connectionWithCursorInfo({
  nodeType: HomeViewSectionType,
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
