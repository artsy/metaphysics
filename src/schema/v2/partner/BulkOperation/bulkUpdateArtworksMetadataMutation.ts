import {
  GraphQLBoolean,
  GraphQLFloat,
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
import { BulkArtworkFilterInput } from "./shared"
import { BulkUpdateSourceEnum } from "../BulkUpdateSourceEnum"

interface Input {
  id: string
  source: string
  metadata?: {
    availability?: string
    domesticShippingFeeCents?: number
    ecommerce: boolean
    locationId?: string
    category?: string
    medium?: string
    offer: boolean
    priceAdjustment?: number
    priceListed?: number
    provenance?: string
    published?: boolean
  }
  filters?: {
    artistId?: string
    availability?: string
    artworkIds?: string[]
    locationId?: string
    partnerArtistId?: string
    published?: boolean
  }
}

const BulkUpdateArtworksMetadataInput = new GraphQLInputObjectType({
  name: "BulkUpdateArtworksMetadataInput",
  fields: {
    availability: {
      type: Availability,
      description: "The availaiblity to be assigned",
    },
    domesticShippingFeeCents: {
      type: GraphQLInt,
      description:
        "Flat fee for domestic shipping. It must be entered in cents.",
    },
    locationId: {
      type: GraphQLString,
      description: "The partner location ID to assign",
    },
    category: {
      type: GraphQLString,
      description: "The category (medium type) to be assigned",
    },
    ecommerce: {
      type: GraphQLBoolean,
      description: "Whether the artworks must be listed as Purchase",
    },
    priceAdjustment: {
      type: GraphQLInt,
      description:
        "Adjusts the artworks' prices according to the value passed (percentage).",
    },
    priceListed: {
      type: GraphQLFloat,
      description: "The price for the artworks",
    },
    offer: {
      type: GraphQLBoolean,
      description: "Whether the artworks must be listed as Make Offer",
    },
    published: {
      type: GraphQLBoolean,
      description: "Publish or unpublish artworks",
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
    if (object.mutationError || object._type === "GravityMutationError") {
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
    source: {
      type: BulkUpdateSourceEnum,
      description:
        "Source of the mutation being triggered, E.g. admin, artworks_list",
    },
    metadata: {
      type: BulkUpdateArtworksMetadataInput,
      description: "Metadata to be updated",
    },
    filters: {
      type: BulkArtworkFilterInput,
      description: "Filter options to apply",
    },
  },
  outputFields: {
    bulkUpdateArtworksMetadataOrError: {
      type: BulkUpdateArtworksMetadataMutationType,
      resolve: (result) => {
        if (result._type === "GravityMutationError") {
          return result
        }
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
    { id, filters, metadata, source },
    { updatePartnerArtworksMetadataLoader }
  ) => {
    const gravityOptions: any = {
      source,
    }

    if (metadata) {
      gravityOptions.metadata = {
        availability: metadata.availability,
        domestic_shipping_fee_cents: metadata.domesticShippingFeeCents,
        location_id: metadata.locationId,
        category: metadata.category,
        medium: metadata.medium,
        price_adjustment: metadata.priceAdjustment,
        provenance: metadata.provenance,
        price_listed: metadata.priceListed,
        published: metadata.published,
        offer: metadata.offer,
        ecommerce: metadata.ecommerce,
      }
    }

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
        throw new Error(error.message || error.toString())
      }
    }
  },
})
