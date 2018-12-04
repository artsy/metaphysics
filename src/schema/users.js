import { clone } from "lodash"
import { UserType } from "./user"
import { GraphQLList, GraphQLString } from "graphql"

const Users = {
  type: new GraphQLList(UserType),
  description: "A list of Users",
  args: {
    ids: {
      type: new GraphQLList(GraphQLString),
    },
  },
  resolve: (root, options, request, { rootValue: { usersLoader } }) => {
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
