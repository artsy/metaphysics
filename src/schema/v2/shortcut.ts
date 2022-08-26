import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLID,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { IDFields } from "./object_identification"

export interface Shortcut {
  id: string
  long: string
  short: string
}

export const shortcutType = new GraphQLObjectType<Shortcut, ResolverContext>({
  name: "Shortcut",
  fields: {
    ...IDFields,
    long: { type: new GraphQLNonNull(GraphQLString) },
    short: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const shortcut: GraphQLFieldConfig<void, ResolverContext> = {
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  type: shortcutType,
  resolve: (_source, { id }, { shortcutLoader }) => {
    return shortcutLoader(id)
  },
}
