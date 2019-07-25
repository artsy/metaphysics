import { clone } from "lodash"
import { UserType } from "./user"
import { GraphQLList, GraphQLString, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"

const Users: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(UserType),
  description: "A list of Users",
  args: {
    ids: {
      type: new GraphQLList(GraphQLString),
    },
  },
  resolve: (_root, options, { usersLoader }) => {
    if (!usersLoader) return null
    const cleanedOptions = clone(options)
    // make ids singular to match gravity :id
    if (options.ids) {
      cleanedOptions.id = options.ids
      delete cleanedOptions.ids
    }
    return usersLoader(cleanedOptions)
  },
}

export default Users
