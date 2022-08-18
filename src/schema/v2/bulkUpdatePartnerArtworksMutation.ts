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
  location: string | null
}

const BulkUpdatePartnerArtworksResponseType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "BulkUpdatePartnerArtworksResponse",
  fields: () => ({
    count: { type: GraphQLInt },
    ids: { type: GraphQLList(GraphQLString) },
  }),
})

const BulkUpdatePartnerArtworksMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "BulkUpdatePartnerArtworksMutationSuccess",
  fields: () => ({
    updatedPartnerArtworks: { type: BulkUpdatePartnerArtworksResponseType },
    skippedPartnerArtworks: { type: BulkUpdatePartnerArtworksResponseType },
  }),
})

const BulkUpdatePartnerArtworksMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "BulkUpdatePartnerArtworksMutationFailure",
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

const BulkUpdatePartnerArtworksMutationType = new GraphQLUnionType({
  name: "BulkUpdatePartnerArtworksMutationType",
  types: [
    BulkUpdatePartnerArtworksMutationSuccessType,
    BulkUpdatePartnerArtworksMutationFailureType,
  ],
  resolveType: (object) => {
    if (object.mutationError) {
      return BulkUpdatePartnerArtworksMutationFailureType
    }
    return BulkUpdatePartnerArtworksMutationSuccessType
  },
})

export const bulkUpdatePartnerArtworksMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "BulkUpdatePartnerArtworksMutation",
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
    location: {
      type: GraphQLString,
      description: "The partner location ID to assign",
    },
  },
  outputFields: {
    bulkUpdatePartnerArtworksOrError: {
      type: BulkUpdatePartnerArtworksMutationType,
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
    { id, artsyShippingDomestic, artsyShippingInternational, location },
    { updatePartnerArtworksLoader }
  ) => {
    const gravityOptions = {
      artsy_shipping_domestic: artsyShippingDomestic,
      artsy_shipping_international: artsyShippingInternational,
      location,
    }

    if (!updatePartnerArtworksLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await updatePartnerArtworksLoader(id, gravityOptions)
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
