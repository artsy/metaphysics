import {
  GraphQLFieldConfigMap,
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
} from "graphql"
import { toGlobalId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "../object_identification"
import { HomeViewComponent } from "./HomeViewComponent"

// section interface
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
