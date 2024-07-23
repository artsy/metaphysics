import {
  GraphQLFieldConfigMap,
  GraphQLInterfaceType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields, NodeInterface } from "../object_identification"
import { HomeViewComponent } from "./HomeViewComponent"

// section interface

const standardSectionFields: GraphQLFieldConfigMap<any, ResolverContext> = {
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
  },
  isTypeOf: (value) => {
    return value.component.type === "ArtworksRail"
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
  },
  isTypeOf: (value) => {
    return value.component.type === "ArtistsRail"
  },
})

// the Section union type of all concrete sections

export const HomeViewSectionType = new GraphQLUnionType({
  name: "HomeViewSection",
  types: [ArtworksRailHomeViewSectionType, ArtistsRailHomeViewSectionType],
})
