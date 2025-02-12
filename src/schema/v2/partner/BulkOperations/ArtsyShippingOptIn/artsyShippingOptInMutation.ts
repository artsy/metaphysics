import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  GravityMutationErrorType,
  formatGravityError,
} from "lib/gravityErrorHandler"
import { GraphQLObjectType } from "graphql"
import { GraphQLUnionType } from "graphql"

interface Input {
  id: string
  artsyShippingDomestic: boolean | null
  artsyShippingInternational: boolean | null
}

const ArtsyShippingOptInResponseType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArtsyShippingOptInResponse",
  fields: () => ({
    count: { type: GraphQLInt },
    ids: { type: GraphQLList(GraphQLString) },
  }),
})

const ArtsyShippingOptInMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArtsyShippingOptInMutationSuccess",
  fields: () => ({
    updatedPartnerArtworks: {
      type: ArtsyShippingOptInResponseType,
    },
    skippedPartnerArtworks: {
      type: ArtsyShippingOptInResponseType,
    },
  }),
})

const ArtsyShippingOptInMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArtsyShippingOptInMutationFailure",
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

const ArtsyShippingOptInMutationType = new GraphQLUnionType({
  name: "ArtsyShippingOptInMutationType",
  types: [
    ArtsyShippingOptInMutationSuccessType,
    ArtsyShippingOptInMutationFailureType,
  ],
  resolveType: (object) => {
    if (object.mutationError) {
      return ArtsyShippingOptInMutationFailureType
    }
    return ArtsyShippingOptInMutationSuccessType
  },
})

export const artsyShippingOptInMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "ArtsyShippingOptInMutation",
  description: "Update all artworks that belong to the partner",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the partner",
    },
    artsyShippingDomestic: {
      type: GraphQLBoolean,
      description: "Whether Artsy domestic shipping should be enabled",
    },
    artsyShippingInternational: {
      type: GraphQLBoolean,
      description: "Whether Artsy international shipping should be enabled",
    },
  },
  outputFields: {
    bulkUpdatePartnerArtworksOrError: {
      type: ArtsyShippingOptInMutationType,
      resolve: (result) => {
        // In the future it could be helpful to have a list of successfully opted in ids, can add this to gravity at a later date
        return {
          updatedPartnerArtworks: { count: result.success, ids: [] },
          skippedPartnerArtworks: {
            count: result.errors.count,
            ids: result.errors.ids,
          },
        }
      },
    },
  },
  mutateAndGetPayload: async (
    { id, artsyShippingDomestic, artsyShippingInternational },
    { updatePartnerArtworksLoader }
  ) => {
    const gravityOptions = {
      artsy_shipping_domestic: artsyShippingDomestic,
      artsy_shipping_international: artsyShippingInternational,
    }

    if (!updatePartnerArtworksLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await updatePartnerArtworksLoader(id, gravityOptions) // fix
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
