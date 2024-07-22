import {
  GraphQLInterfaceType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { InternalIDFields, NodeInterface } from "../object_identification"
import { HomeViewComponent } from "./HomeViewComponent"

// section interface

import { ResolverContext } from "types/graphql"
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

export const HomeViewSectionType = new GraphQLUnionType({
  name: "HomeViewSection",
  types: [ArtworksRailSectionType, ArtistsRailSectionType],
})
