import {
  GraphQLList,
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
} from "graphql"
import { error } from "lib/loggers"
import { ResolverContext } from "types/graphql"

const UserRoleType = new GraphQLObjectType<any, ResolverContext>({
  name: "UserRole",
  description: "Fields corresponding to a given product privilege",
  fields: {
    name: {
      type: new GraphQLNonNull(GraphQLString),
      description: "unique label for this role",
    },
  },
})

export const UserRoles: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(UserRoleType))),
  description: "List of all available product privileges",
  resolve: async (_root, _args, { userRolesLoader }) => {
    if (!userRolesLoader) {
      error("You need to pass a X-Access-Token header to perform this action")
      return []
    }

    try {
      return await userRolesLoader()
    } catch (error) {
      error("Error fetching user roles", error)
      return []
    }
  },
}
