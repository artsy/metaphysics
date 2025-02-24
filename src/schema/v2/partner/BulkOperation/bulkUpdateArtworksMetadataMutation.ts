import {
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
  GraphQLFloat,
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
  metadata: {
    location_id: string | null
    category: string | null
    price_listed: number | null
  } | null
}

const BulkUpdateArtworksMetadataInput = new GraphQLInputObjectType({
  name: "BulkUpdateArtworksMetadataInput",
  fields: {
    location_id: {
      type: GraphQLString,
      description: "The partner location ID to assign",
    },
    category: {
      type: GraphQLString,
      description: "The category (medium type) to be assigned",
    },
    price_listed: {
      type: GraphQLFloat,
      description: "The price for the artworks",
    },
  },
})

const BulkUpdateArtworksMetadataResponseType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "BulkUpdateArtworksMetadataResponse",
  fields: () => ({
    count: { type: GraphQLInt },
    ids: { type: GraphQLList(GraphQLString) },
  }),
})

const BulkUpdateArtworksMetadataMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "BulkUpdateArtworksMetadataMutationSuccess",
  fields: () => ({
    updatedPartnerArtworks: {
      type: BulkUpdateArtworksMetadataResponseType,
    },
    skippedPartnerArtworks: {
      type: BulkUpdateArtworksMetadataResponseType,
    },
  }),
})

const BulkUpdateArtworksMetadataMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "BulkUpdateArtworksMetadataMutationFailure",
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

const BulkUpdateArtworksMetadataMutationType = new GraphQLUnionType({
  name: "BulkUpdateArtworksMetadataMutationType",
  types: [
    BulkUpdateArtworksMetadataMutationSuccessType,
    BulkUpdateArtworksMetadataMutationFailureType,
  ],
  resolveType: (object) => {
    if (object.mutationError) {
      return BulkUpdateArtworksMetadataMutationFailureType
    }
    return BulkUpdateArtworksMetadataMutationSuccessType
  },
})

export const bulkUpdateArtworksMetadataMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "BulkUpdateArtworksMetadataMutation",
  description: "Update all artworks that belong to the partner",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the partner",
    },
    metadata: {
      type: BulkUpdateArtworksMetadataInput,
      description: "Metadata to be updated",
    },
  },
  outputFields: {
    bulkUpdateArtworksMetadataOrError: {
      type: BulkUpdateArtworksMetadataMutationType,
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
    { id, metadata },
    { updatePartnerArtworksMetadataLoader }
  ) => {
    const gravityOptions = {
      metadata: metadata,
    }

    if (!updatePartnerArtworksMetadataLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await updatePartnerArtworksMetadataLoader(id, gravityOptions)
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
