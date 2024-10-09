import {
  GraphQLFieldConfigMap,
  GraphQLID,
  GraphQLInterfaceType,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { HomeViewSectionTypeNames } from "./names"
import { toGlobalId } from "graphql-relay"
import { InternalIDFields } from "schema/v2/object_identification"
import { ResolverContext } from "types/graphql"
import { HomeViewComponent } from "../HomeViewComponent"

export const standardSectionFields: GraphQLFieldConfigMap<
  any,
  ResolverContext
> = {
  ...InternalIDFields,
  id: {
    type: new GraphQLNonNull(GraphQLID),
    description: "A globally unique ID.",
    resolve: ({ id }) => {
      return toGlobalId("HomeViewSection", id)
    },
  },
  contextModule: {
    type: GraphQLString,
    description:
      "[Analytics] `context module` analytics value for this section, as defined in our schema (artsy/cohesion)",
  },
  component: {
    type: HomeViewComponent,
    description:
      "Component prescription for this section, for overriding or customizing presentation and behavior",
  },
  ownerType: {
    type: GraphQLString,
    description:
      "[Analytics] `owner type` analytics value for this scetion when displayed in a standalone UI, as defined in our schema (artsy/cohesion)",
  },
}

export const HomeViewGenericSectionInterface = new GraphQLInterfaceType({
  name: HomeViewSectionTypeNames.HomeViewSectionGeneric,
  description: "Abstract interface shared by every kind of home view section",
  fields: standardSectionFields,
  resolveType: (value) => {
    return value.type
  },
})
