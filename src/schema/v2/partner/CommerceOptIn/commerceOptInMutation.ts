import { GraphQLBoolean, GraphQLObjectType, GraphQLUnionType } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"

export const CommerceOptInType = new GraphQLObjectType<any, ResolverContext>({
  name: "CommerceOptIn",
  fields: () => ({
    exactPrice: { type: GraphQLBoolean },
    pickupAvailable: { type: GraphQLBoolean },
    framed: { type: GraphQLBoolean },
    certificateOfAuthenticity: { type: GraphQLBoolean },
    coaByGallery: { type: GraphQLBoolean },
    coaByAuthenticatingBody: { type: GraphQLBoolean },
  }),
})

interface Input {
  exactPrice?: boolean
  pickupAvailable?: boolean
  framed?: boolean
  certificateOfAuthenticity?: boolean
  coaByGallery?: boolean
  coaByAuthenticatingBody?: boolean
}

// interface GravityInput {
//   exact_price?: boolean
//   pickup_available?: boolean
//   framed?: boolean
//   certificate_of_authenticity?: boolean
//   coa_by_gallery?: boolean
// 	coa_by_authenticating_body?: boolean
// }

const CommerceOptInSuccesssType = new GraphQLObjectType<any, ResolverContext>({
  name: "CommerceOptInSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    commerceOptInMutation: { type: CommerceOptInType },
  }),
})

const CommerceOptInFailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CommerceOptInFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const CommerceOptInMutationType = new GraphQLUnionType({
  name: "CommerceOptInMutationType",
  types: [CommerceOptInSuccesssType, CommerceOptInFailureType],
  resolveType: (object) => {
    if (object.mutationError) {
      return CommerceOptInFailureType
    }
    return CommerceOptInSuccesssType
  },
})

export const commerceOptInMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "commerceOptInMutation",
  description: "Opt all eligible artworks into BNMO",
  inputFields: {
    exactPrice: {
      type: GraphQLBoolean,
      description: "whether or not the artwork is set to exact price",
    },
    pickupAvailable: {
      type: GraphQLBoolean,
      description: "whether or not pick up it is pick up available",
    },
    framed: {
      type: GraphQLBoolean,
      description: "whether or not it is framed",
    },
    certificateOfAuthenticity: {
      type: GraphQLBoolean,
      description: "whether or not there is a CoA",
    },
    coaByGallery: {
      type: GraphQLBoolean,
      description: "whether or not the CoA is by the gallery",
    },
    coaByAuthenticatingBody: {
      type: GraphQLBoolean,
      description: "whether or not the CoA is by an authenticating body",
    },
  },
  outputFields: {
    commerceOptInMutationOrError: {
      type: CommerceOptInMutationType,
      resolve: (result) => {
        return {
          updatedCommerceOptIn: {},
          skippedCommerceOptIn: {
            count: result.errors.count,
            ids: result.errors.ids,
          },
        }
      },
    },
  },
  mutateAndGetPayload: async (
    {
      exactPrice,
      pickupAvailable,
      framed,
      certificateOfAuthenticity,
      coaByGallery,
      coaByAuthenticatingBody,
    },
    { commerceOptInLoader }
  ) => {
    const gravityOptions = {
      exact_price: exactPrice,
      pickup_available: pickupAvailable,
      framed,
      certificate_of_authenticity: certificateOfAuthenticity,
      coa_by_gallery: coaByGallery,
      coa_by_authenticating_body: coaByAuthenticatingBody,
    }

    if (!commerceOptInLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await commerceOptInLoader(gravityOptions)
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
