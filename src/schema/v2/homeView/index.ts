import {
  GraphQLObjectType,
  GraphQLFieldConfig,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLEnumType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { stubDataResolver } from "./stubDataResolver"

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
  interfaces: [GenericSectionInterface],
  fields: {
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
  interfaces: [GenericSectionInterface],
  fields: {
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

// a list (TODO: connection) of sections

const Sections: GraphQLFieldConfig<void, ResolverContext> = {
  type: GraphQLNonNull(GraphQLList(GraphQLNonNull(SectionType))),
  description: "A list of sections on the home view",
  resolve: stubDataResolver,
}

// root homeView field

const HomeViewType = new GraphQLObjectType<any, ResolverContext>({
  name: "HomeView",
  description: "Experimental schema for new home view",
  fields: {
    sections: Sections,
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
