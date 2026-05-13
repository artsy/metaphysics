import {
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
import { ResolverContext } from "types/graphql"
import { BulkArtworkFilterInput } from "./shared"
import { BulkUpdateSourceEnum } from "../BulkUpdateSourceEnum"

interface Input {
  id: string
  showId: string
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

const BulkAddArtworksToShowResponseType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "BulkAddArtworksToShowResponse",
  fields: () => ({
    count: { type: GraphQLInt },
    ids: { type: GraphQLList(GraphQLString) },
  }),
})

const BulkAddArtworksToShowMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "BulkAddArtworksToShowMutationSuccess",
  fields: () => ({
    updatedPartnerArtworks: {
      type: BulkAddArtworksToShowResponseType,
    },
    skippedPartnerArtworks: {
      type: BulkAddArtworksToShowResponseType,
    },
  }),
})

const BulkAddArtworksToShowMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "BulkAddArtworksToShowMutationFailure",
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

const BulkAddArtworksToShowMutationType = new GraphQLUnionType({
  name: "BulkAddArtworksToShowMutationType",
  types: [
    BulkAddArtworksToShowMutationSuccessType,
    BulkAddArtworksToShowMutationFailureType,
  ],
  resolveType: (object) => {
    if (object.mutationError || object._type === "GravityMutationError") {
      return BulkAddArtworksToShowMutationFailureType
    }
    return BulkAddArtworksToShowMutationSuccessType
  },
})

export const bulkAddArtworksToShowMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "BulkAddArtworksToShowMutation",
  description: "Bulk add artworks to a show",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the partner",
    },
    showId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the show to which artworks will be added",
    },
    source: {
      type: BulkUpdateSourceEnum,
      description:
        "Source of the mutation being triggered, E.g. admin, artworks_list",
    },
    filters: {
      type: BulkArtworkFilterInput,
      description: "Filter options to apply",
    },
  },
  outputFields: {
    bulkAddArtworksToShowOrError: {
      type: BulkAddArtworksToShowMutationType,
      resolve: (result) => {
        if (result._type === "GravityMutationError") {
          return result
        }
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
    { id, showId, source, filters },
    { addArtworksToShowLoader }
  ) => {
    const gravityOptions: any = {}

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

    if (!addArtworksToShowLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await addArtworksToShowLoader(id, {
        show_id: showId,
        source,
        filters: gravityOptions.filters,
      })
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
