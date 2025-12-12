import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { InternalIDFields } from "../object_identification"

export const NavigationItemType = new GraphQLObjectType({
  name: "NavigationItem",
  fields: () => ({
    ...InternalIDFields,
    title: {
      type: new GraphQLNonNull(GraphQLString),
    },
    href: {
      type: GraphQLString,
      description: "A relative URL that starts with /",
    },
    position: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    children: {
      type: new GraphQLList(NavigationItemType),
    },
  }),
})
