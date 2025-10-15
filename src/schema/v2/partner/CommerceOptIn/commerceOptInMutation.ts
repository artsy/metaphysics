import { GraphQLNonNull } from "graphql"
import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { BulkUpdateSourceEnum } from "../BulkUpdateSourceEnum"

export const CommerceOptInResponseType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CommerceOptInResponse",
  fields: () => ({
    count: { type: GraphQLInt },
    ids: { type: GraphQLList(GraphQLString) },
  }),
})

interface Input {
  id: string
  source: string
  exactPrice?: boolean
  pickupAvailable?: boolean
  framed?: boolean
  certificateOfAuthenticity?: boolean
  coaByGallery?: boolean
  coaByAuthenticatingBody?: boolean
  locationId?: string
  artsyShippingDomestic?: boolean
  signedByArtist?: boolean
  stampedByArtistEstate?: boolean
  stickerLabel?: boolean
  signedInPlate?: boolean
  signedOther?: boolean
  notSigned?: boolean
}

const CommerceOptInSuccesssType = new GraphQLObjectType<any, ResolverContext>({
  name: "CommerceOptInSuccess",
  fields: () => ({
    updatedCommerceOptIn: {
      type: CommerceOptInResponseType,
      resolve: (result) => {
        return { count: result.success, ids: [] }
      },
    },
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
    if (object._type == "GravityMutationError") {
      return CommerceOptInFailureType
    }

    return CommerceOptInSuccesssType
  },
})

export const commerceOptInMutation = mutationWithClientMutationId({
  name: "CommerceOptInMutation",
  description: "Opt all eligible artworks into BNMO",
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
    locationId: {
      type: GraphQLString,
      description: "The partner location ID to assign",
    },
    artsyShippingDomestic: {
      type: GraphQLBoolean,
      description: "Opt artwork into Artsy Shipping Domestic",
    },
    signedByArtist: {
      type: GraphQLBoolean,
      description: "whether or not it is signed",
    },
    stampedByArtistEstate: {
      type: GraphQLBoolean,
      description: "whether or not it is stamped by the artist estate",
    },
    stickerLabel: {
      type: GraphQLBoolean,
      description: "whether or not it has a sticker label",
    },
    signedInPlate: {
      type: GraphQLBoolean,
      description: "whether or not it is signed in plate",
    },
    signedOther: {
      type: GraphQLBoolean,
      description: "whether or not other is selected for signature",
    },
    notSigned: {
      type: GraphQLBoolean,
      description: "whether or not it is not signed",
    },
  },
  outputFields: {
    commerceOptInMutationOrError: {
      type: CommerceOptInMutationType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    {
      id,
      exactPrice,
      pickupAvailable,
      framed,
      certificateOfAuthenticity,
      coaByGallery,
      coaByAuthenticatingBody,
      locationId,
      artsyShippingDomestic,
      signedByArtist,
      stampedByArtistEstate,
      stickerLabel,
      signedInPlate,
      signedOther,
      source,
      notSigned,
    },
    { optInArtworksIntoCommerceLoader }
  ) => {
    const gravityOptions = {
      exact_price: exactPrice,
      pickup_available: pickupAvailable,
      framed,
      certificate_of_authenticity: certificateOfAuthenticity,
      coa_by_gallery: coaByGallery,
      coa_by_authenticating_body: coaByAuthenticatingBody,
      location_id: locationId,
      artsy_shipping_domestic: artsyShippingDomestic,
      signed_by_artist: signedByArtist,
      stamped_by_artist_estate: stampedByArtistEstate,
      sticker_label: stickerLabel,
      signed_in_plate: signedInPlate,
      signed_other: signedOther,
      source,
      not_signed: notSigned,
    }

    if (!optInArtworksIntoCommerceLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await optInArtworksIntoCommerceLoader(id, gravityOptions)
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
