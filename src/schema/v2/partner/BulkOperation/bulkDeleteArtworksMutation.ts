import {
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  GravityMutationErrorType,
  formatGravityError,
} from "lib/gravityErrorHandler"
import { Availability } from "schema/v2/types/availability"
import { ResolverContext } from "types/graphql"
import { BulkUpdateSourceEnum } from "../BulkUpdateSourceEnum"

interface Input {
  id: string
  source: string
  filters?: {
    artistId?: string
    availability?: string
    artworkIds?: string[]
    locationId?: string
    partnerArtistId?: string
    published?: boolean
  }
}

const BulkDeleteArtworkFilterInput = new GraphQLInputObjectType({
  name: "BulkDeleteArtworkFilterInput",
  fields: {
    artistId: {
      type: GraphQLString,
      description: "Filter artworks by artist id",
    },
    availability: {
      type: Availability,
      description: "Filter artworks by availability",
    },
    artworkIds: {
      type: new GraphQLList(GraphQLString),
      description: "Filter artworks with matching ids",
    },
    locationId: {
      type: GraphQLString,
      description: "Filter artworks by location",
    },
    partnerArtistId: {
      type: GraphQLString,
      description: "Filter artworks by partner artist id",
    },
    published: {
      type: GraphQLBoolean,
      description: "Filter artworks by published status",
    },
  },
})

const BulkDeleteArtworksResponseType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "BulkDeleteArtworksResponse",
  fields: () => ({
    count: { type: GraphQLInt },
    ids: { type: new GraphQLList(GraphQLString) },
  }),
})

const BulkDeleteArtworksMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "BulkDeleteArtworksMutationSuccess",
  fields: () => ({
    deletedPartnerArtworks: {
      type: BulkDeleteArtworksResponseType,
    },
    skippedPartnerArtworks: {
      type: BulkDeleteArtworksResponseType,
    },
  }),
})

const BulkDeleteArtworksMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "BulkDeleteArtworksMutationFailure",
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

const BulkDeleteArtworksMutationType = new GraphQLUnionType({
  name: "BulkDeleteArtworksMutationType",
  types: [
    BulkDeleteArtworksMutationSuccessType,
    BulkDeleteArtworksMutationFailureType,
  ],
  resolveType: (object) => {
    if (object.mutationError || object._type === "GravityMutationError") {
      return BulkDeleteArtworksMutationFailureType.name
    }
    return BulkDeleteArtworksMutationSuccessType.name
  },
})

export const bulkDeleteArtworksMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "BulkDeleteArtworksMutation",
  description: "Delete all artworks that belong to the partner",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the partner",
    },
    source: {
      type: BulkUpdateSourceEnum,
      description:
        "Source of the mutation being triggered, E.g. admin, artworks_list",
    },
    filters: {
      type: BulkDeleteArtworkFilterInput,
      description:
        "Filter options to select the artworks to delete. At least one filter is required.",
    },
  },
  outputFields: {
    bulkDeleteArtworksOrError: {
      type: BulkDeleteArtworksMutationType,
      resolve: (result) => {
        if (result._type === "GravityMutationError") {
          return result
        }
        return {
          deletedPartnerArtworks: { count: result.success, ids: [] },
          skippedPartnerArtworks: {
            count: result.errors.count,
            ids: result.errors.ids,
          },
        }
      },
    },
  },
  mutateAndGetPayload: async (
    { id, filters, source },
    { deletePartnerArtworksLoader }
  ) => {
    if (!deletePartnerArtworksLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const gravityOptions: any = { source }

    if (filters) {
      gravityOptions.filters = {
        artist_id: filters.artistId,
        availability: filters.availability,
        artwork_ids: filters.artworkIds,
        location_id: filters.locationId,
        partner_artist_id: filters.partnerArtistId,
        published: filters.published,
      }
    }

    try {
      return await deletePartnerArtworksLoader(id, gravityOptions)
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error.message || error.toString())
      }
    }
  },
})
