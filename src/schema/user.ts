import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLFieldConfig,
} from "graphql"
import cached from "./fields/cached"
import { GravityIDFields } from "./object_identification"
import { LocationType } from "schema/location"
import { ResolverContext } from "types/graphql"

export const UserType = new GraphQLObjectType<any, ResolverContext>({
  name: "User",
  fields: () => ({
    ...GravityIDFields,
    cached,
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
  }),
})

export const User: GraphQLFieldConfig<void, ResolverContext> = {
  type: UserType,
  args: {
    email: {
      type: GraphQLString,
      description: "Email to search for user by",
    },
    id: {
      type: GraphQLString,
      description: "ID of the user",
    },
  },
  resolve: (_root, option, { userByEmailLoader, userByIDLoader }) => {
    const promise = option.id
      ? userByIDLoader(option.id)
      : userByEmailLoader(option)
    return promise
      .then(result => {
        return result
      })
      .catch(err => {
        if (err.statusCode === 404) {
          return false
        }
      })
  },
}
