import {
  GraphQLString,
  GraphQLFloat,
  GraphQLInt,
  GraphQLInputObjectType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"

import { UserType } from "../user"

export const EditableLocationFields = new GraphQLInputObjectType({
  name: "EditableLocation",
  fields: {
    address: {
      description: "First line of an address",
      type: GraphQLString,
    },
    address_2: {
      description: "Second line of an address",
      type: GraphQLString,
    },
    city: {
      description: "The city the location is based in",
      type: GraphQLString,
    },
    country: {
      description: "The county the location is based in",
      type: GraphQLString,
    },
    summary: {
      description: "An optional display string for the location",
      type: GraphQLString,
    },
    postal_code: {
      description: "Postal code for a string",
      type: GraphQLString,
    },
    state: {
      description: "The (optional) name of the state for location",
      type: GraphQLString,
    },
    state_code: {
      description: "The (optional) state code of the state for location",
      type: GraphQLString,
    },
  },
})

export default mutationWithClientMutationId({
  name: "UpdateMyProfile",
  description: "Update the current logged in user.",
  inputFields: {
    name: {
      description: "The given name of the user.",
      type: GraphQLString,
    },
    email: {
      description: "The given email of the user.",
      type: GraphQLString,
    },
    phone: {
      description: "The given phone number of the user.",
      type: GraphQLString,
    },
    location: {
      description: "The given location of the user as structured data",
      type: EditableLocationFields,
    },
    collector_level: {
      description: "The collector level for the user",
      type: GraphQLInt,
    },
    price_range_min: {
      description: "The minimum price collector has selected",
      type: GraphQLInt,
    },
    price_range_max: {
      description: "The maximum price collector has selected",
      type: GraphQLFloat,
    },
  },
  outputFields: {
    user: {
      type: UserType,
      resolve: user => user,
    },
  },
  mutateAndGetPayload: (user, _request, { rootValue: { updateMeLoader } }) => {
    if (!updateMeLoader) {
      throw new Error("No updateMeLoader loader found in root values")
    }
    return updateMeLoader(user)
  },
})
