import {
  GraphQLBoolean,
  GraphQLString,
  GraphQLFloat,
  GraphQLInt,
  GraphQLInputObjectType,
  GraphQLUnionType,
  GraphQLObjectType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"

import { UserType } from "../user"
import Me from "./"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { snakeCase } from "lodash"

export const EditableLocationFields = new GraphQLInputObjectType({
  name: "EditableLocation",
  fields: {
    address: {
      description: "First line of an address",
      type: GraphQLString,
    },
    address2: {
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
    postalCode: {
      description: "Postal code for a string",
      type: GraphQLString,
    },
    state: {
      description: "The (optional) name of the state for location",
      type: GraphQLString,
    },
    stateCode: {
      description: "The (optional) state code of the state for location",
      type: GraphQLString,
    },
  },
})

const UpdateMyProfileMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "UpdateMyProfileMutationSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    user: {
      type: UserType,
      resolve: (user) => user,
    },
  }),
})

const UpdateMyProfileMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "UpdateMyProfileMutationFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const UpdateMyProfileMutationType = new GraphQLUnionType({
  name: "UpdateMyProfileMutation",
  types: [
    UpdateMyProfileMutationSuccessType,
    UpdateMyProfileMutationFailureType,
  ],
})

export default mutationWithClientMutationId<any, any, ResolverContext>({
  name: "UpdateMyProfile",
  description: "Update the current logged in user.",
  inputFields: {
    artworksPerYear: {
      type: GraphQLString,
      description: "Number of artworks purchased per year.",
    },
    collectorLevel: {
      description: "The collector level for the user",
      type: GraphQLInt,
    },
    completedOnboarding: {
      description: "The user completed onboarding.",
      type: GraphQLBoolean,
    },
    email: { description: "The given email of the user.", type: GraphQLString },
    emailFrequency: {
      description: "Frequency of marketing emails.",
      type: GraphQLString,
    },
    gender: { type: GraphQLString, description: "Gender." },
    industry: {
      type: GraphQLString,
      description: "Works in the art industry?",
    },
    isCollector: { type: GraphQLBoolean, description: "Is a collector?" },
    location: {
      description: "The given location of the user as structured data",
      type: EditableLocationFields,
    },
    name: { description: "The given name of the user.", type: GraphQLString },
    notes: { type: GraphQLString, description: "Additional personal notes." },
    password: {
      description: "The user's password, required to change email address.",
      type: GraphQLString,
    },
    phone: {
      description: "The given phone number of the user.",
      type: GraphQLString,
    },
    priceRangeMax: {
      description: "The maximum price collector has selected",
      type: GraphQLFloat,
    },
    priceRangeMin: {
      description: "The minimum price collector has selected",
      type: GraphQLInt,
    },
    profession: { type: GraphQLString, description: "Profession." },
    receiveLotOpeningSoonNotification: {
      description: "This user should receive lot opening notifications",
      type: GraphQLBoolean,
    },
    receiveNewSalesNotification: {
      description: "This user should receive new sales notifications",
      type: GraphQLBoolean,
    },
    receiveNewWorksNotification: {
      description: "This user should receive new works notifications",
      type: GraphQLBoolean,
    },
    receiveOutbidNotification: {
      description: "This user should receive outbid notifications",
      type: GraphQLBoolean,
    },
    receivePromotionNotification: {
      description: "This user should receive promotional notifications",
      type: GraphQLBoolean,
    },
    receivePurchaseNotification: {
      description: "This user should receive purchase notifications",
      type: GraphQLBoolean,
    },
    receiveSaleOpeningClosingNotification: {
      description:
        "This user should receive sale opening/closing notifications",
      type: GraphQLBoolean,
    },
    shareFollows: {
      description:
        "Shares FollowArtists, FollowGenes, and FollowProfiles with partners.",
      type: GraphQLBoolean,
    },
  },
  outputFields: {
    user: {
      type: UserType,
      resolve: (user) => user,
    },
    userOrError: {
      type: UpdateMyProfileMutationType,
      resolve: (result) => result,
    },
    me: Me,
  },
  mutateAndGetPayload: async (args, { updateMeLoader }) => {
    // snake_case keys for Gravity (keys are the same otherwise)
    const user = Object.keys(args).reduce(
      (acc, key) => ({ ...acc, [snakeCase(key)]: args[key] }),
      {}
    )

    if (!updateMeLoader) {
      throw new Error("No updateMeLoader loader found in root values")
    }

    try {
      return updateMeLoader(user)
    } catch (error) {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    }
  },
})
