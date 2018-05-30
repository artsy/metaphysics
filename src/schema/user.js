import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLBoolean,
} from "graphql"
import cached from "./fields/cached"
import { GravityIDFields } from "./object_identification"
import { LocationType } from "schema/location"

export const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => {return {
    ...GravityIDFields,
    cached,
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
    price_range: {
      description: "The price range the collector has selected",
      type: GraphQLString,
    },
    userAlreadyExists: {
      description:
        "Check whether a user exists by email address before creating an account.",
      type: GraphQLBoolean,
      resolve: ({ id }) => {
        if (id) {
          return true
        }
        return false
      },
    },
  }},
})

const User = {
  type: UserType,
  name: "User",
  args: {
    email: {
      type: GraphQLString,
      description: "Email to search for user by",
    },
  },
  resolve: (root, option, request, { rootValue: { userLoader } }) =>
    {return userLoader(option)
      .then(result => {return result})
      .catch(err => {
        if (err.statusCode === 404) {
          return false
        }

        return undefined
      })},
}

export default User
