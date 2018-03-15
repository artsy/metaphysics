import UserType from "./user"
import { GraphQLList, GraphQLString } from "graphql"

const Users = {
  type: new GraphQLList(UserType),
  description: "A list of Users",
  args: {
    ids: {
      type: new GraphQLList(GraphQLString),
    },
  },
  resolve: (root, options, request, { rootValue: { usersLoader } }) =>
    usersLoader(options),
}

export default Users
