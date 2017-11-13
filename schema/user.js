import { GraphQLString, GraphQLObjectType, GraphQLNonNull } from "graphql"
import { LocationType } from "schema/location"

const UserType = new GraphQLObjectType({
  name: "User",
  fields: {
    id: {
      description: "User id.",
      type: new GraphQLNonNull(GraphQLString),
    },
    name: {
      description: "The given name of the user.",
      type: new GraphQLNonNull(GraphQLString),
    },
    email: {
      description: "The given email of the user.",
      type: new GraphQLNonNull(GraphQLString),
    },
    phone: {
      description: "The given phone number of the user.",
      type: GraphQLString,
    },
    location: {
      description: "The given location of the user as structured data",
      type: LocationType,
    },
  },
})

export default UserType
