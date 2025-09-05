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
import {
  ArtworkSignatureTypeEnum,
  transformSignatureFieldsToGravityFields,
} from "schema/v2/artwork/artworkSignatureTypes"
import { Availability } from "schema/v2/types/availability"
import { ResolverContext } from "types/graphql"
import { BulkUpdateSourceEnum } from "../BulkUpdateSourceEnum"
import { BulkArtworkFilterInput } from "./shared"

interface Input {
  id: string
  source: string
  metadata?: {
    editionSetsCount?: number
    artistIds?: string[]
    attributionClass?: string
    availability?: string
    category?: string
    dates?: number[]
    hasCertificateOfAuthenticity?: boolean
    coaByGallery?: boolean
    coaByAuthenticatingBody?: boolean
    conditionDescription?: string
    displayPriceRange?: boolean
    domesticShippingFeeCents?: number
    ecommerce: boolean
    exactPrice?: boolean
    exhibitionHistory?: string
    imageRights?: string
    internationalShippingFeeCents?: number
    literature?: string
    locationId?: string
    medium?: string
    offer: boolean
    priceAdjustment?: number
    priceHidden?: boolean
    priceListed?: number
    provenance?: string
    published?: boolean
    signature?: string
    title?: string
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
    artistIds: {
      type: GraphQLList(GraphQLString),
      description: "The artist IDs to be assigned",
    },
    attributionClass: {
      type: GraphQLString,
      description:
        "The attribution class to be assigned, E.g. unique, open edition, limited edition",
    },
    availability: {
      type: Availability,
      description: "The availaiblity to be assigned",
    },
    category: {
      type: GraphQLString,
      description: "The category (medium type) to be assigned",
    },
    dates: {
      type: GraphQLList(GraphQLInt),
      description: "Array of dates as numbers to be assigned",
    },
    editionSetsCount: {
      type: GraphQLInt,
      description:
        "Number of additional edition sets to be created for each artwork",
    },
    hasCertificateOfAuthenticity: {
      type: GraphQLBoolean,
      description:
        "Whether a certificate of authenticity is provided for these artworks.",
    },
    coaByGallery: {
      type: GraphQLBoolean,
      description: "If COA is provided by the gallery.",
    },
    coaByAuthenticatingBody: {
      type: GraphQLBoolean,
      description: "If COA is provided by a third-party authenticating body.",
    },
    conditionDescription: {
      type: GraphQLString,
      description: "The artwork condition to be assigned",
    },
    displayPriceRange: {
      type: GraphQLBoolean,
      description: "Set artwork price visibility to price range",
    },
    domesticShippingFeeCents: {
      type: GraphQLInt,
      description:
        "Flat fee for domestic shipping. It must be entered in cents.",
    },
    ecommerce: {
      type: GraphQLBoolean,
      description: "Whether the artworks must be listed as Purchase",
    },
    exactPrice: {
      type: GraphQLBoolean,
      description: "Set artwork price visibility to exact price",
    },
    exhibitionHistory: {
      type: GraphQLString,
      description: "The exhibition history to be assigned",
    },
    imageRights: {
      type: GraphQLString,
      description: "The image rights to be assigned",
    },
    internationalShippingFeeCents: {
      type: GraphQLInt,
      description:
        "Flat fee for international shipping. It must be entered in cents.",
    },
    literature: {
      type: GraphQLString,
      description: "The literature to be assigned",
    },
    locationId: {
      type: GraphQLString,
      description: "The partner location ID to assign",
    },
    medium: {
      type: GraphQLString,
      description: "The medium (materials) to be assigned, E.g. Oil on Canvas",
    },
    offer: {
      type: GraphQLBoolean,
      description: "Whether the artworks must be listed as Make Offer",
    },
    priceAdjustment: {
      type: GraphQLInt,
      description:
        "Adjusts the artworks' prices according to the value passed (percentage).",
    },
    priceHidden: {
      type: GraphQLBoolean,
      description: "Set artwork price visibility to price on request",
    },
    priceListed: {
      type: GraphQLFloat,
      description: "The price for the artworks",
    },
    provenance: {
      type: GraphQLString,
      description: "The provenance to be assigned",
    },
    published: {
      type: GraphQLBoolean,
      description: "Publish or unpublish artworks",
    },
    signature: {
      type: GraphQLString,
      description: "Details about the signature",
    },
    signatureTypes: {
      type: new GraphQLList(ArtworkSignatureTypeEnum),
      description: "Types of signatures on the artwork",
    },
    title: {
      type: GraphQLString,
      description: "The title of the artwork",
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
        artist_ids: metadata.artistIds,
        attribution_class: metadata.attributionClass,
        availability: metadata.availability,
        category: metadata.category,
        dates: metadata.dates,
        edition_sets_count: metadata.editionSetsCount,
        certificate_of_authenticity: metadata.hasCertificateOfAuthenticity,
        coa_by_gallery: metadata.coaByGallery,
        coa_by_authenticating_body: metadata.coaByAuthenticatingBody,
        condition_description: metadata.conditionDescription,
        domestic_shipping_fee_cents: metadata.domesticShippingFeeCents,
        ecommerce: metadata.ecommerce,
        exact_price: metadata.exactPrice,
        exhibition_history: metadata.exhibitionHistory,
        image_rights: metadata.imageRights,
        international_shipping_fee_cents:
          metadata.internationalShippingFeeCents,
        literature: metadata.literature,
        location_id: metadata.locationId,
        medium: metadata.medium,
        offer: metadata.offer,
        display_price_range: metadata.displayPriceRange,
        price_adjustment: metadata.priceAdjustment,
        price_hidden: metadata.priceHidden,
        price_listed: metadata.priceListed,
        provenance: metadata.provenance,
        published: metadata.published,
        signature: metadata.signature,
        ...transformSignatureFieldsToGravityFields(metadata.signatureTypes),
        title: metadata.title,
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
