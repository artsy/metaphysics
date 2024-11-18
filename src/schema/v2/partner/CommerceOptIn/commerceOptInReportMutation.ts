import { GraphQLNonNull } from "graphql"
import {
  GraphQLBoolean,
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

export const CommerceOptInReportResponseType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CommerceOptInReportResponse",
  fields: () => ({
    message: { type: GraphQLString },
  }),
})

interface Input {
  id: string
  exactPrice?: boolean
  pickupAvailable?: boolean
  framed?: boolean
  certificateOfAuthenticity?: boolean
  coaByGallery?: boolean
  coaByAuthenticatingBody?: boolean
  eligible?: boolean
  locationId?: string
  artsyShippingDomestic?: boolean
}

const CommerceOptInReportSuccesssType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CommerceOptInReportSuccess",
  fields: () => ({
    createdCommerceOptInReport: {
      type: CommerceOptInReportResponseType,
      resolve: (result) => {
        return { message: result.message }
      },
    },
  }),
})

const CommerceOptInReportFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CommerceOptInReportFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const CommerceOptInReportMutationType = new GraphQLUnionType({
  name: "CommerceOptInReportMutationType",
  types: [CommerceOptInReportSuccesssType, CommerceOptInReportFailureType],
  resolveType: (object) => {
    if (object._type == "GravityMutationError") {
      return CommerceOptInReportFailureType
    }

    return CommerceOptInReportSuccesssType
  },
})

export const commerceOptInReportMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "CommerceOptInReportMutation",
  description:
    "Generate CommerceOptIn report about artworks eligibility for a given partner",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the partner",
    },
    exactPrice: {
      type: GraphQLBoolean,
      description: "whether or not the artworks should be set to exact price",
    },
    pickupAvailable: {
      type: GraphQLBoolean,
      description: "whether or not pick up should be available",
    },
    framed: {
      type: GraphQLBoolean,
      description: "whether or not it should be set to framed",
    },
    certificateOfAuthenticity: {
      type: GraphQLBoolean,
      description: "whether it should be updated to CoA",
    },
    coaByGallery: {
      type: GraphQLBoolean,
      description: "whether or not the CoA is by the gallery",
    },
    coaByAuthenticatingBody: {
      type: GraphQLBoolean,
      description: "whether or not the CoA is by an authenticating body",
    },
    eligible: {
      type: GraphQLBoolean,
      description:
        "whether the report will contain data for eligible or non-eligible artworks.",
    },
    locationId: {
      type: GraphQLString,
      description: "The partner location ID to assign",
    },
    artsyShippingDomestic: {
      type: GraphQLBoolean,
      description: "Opt artwork into Artsy Shipping Domestic",
    },
  },
  outputFields: {
    commerceOptInReportMutationOrError: {
      type: CommerceOptInReportMutationType,
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
      eligible,
      locationId,
      artsyShippingDomestic,
    },
    { createCommerceOptInEligibleArtworksReportLoader }
  ) => {
    const gravityOptions = {
      exact_price: exactPrice,
      pickup_available: pickupAvailable,
      framed,
      certificate_of_authenticity: certificateOfAuthenticity,
      coa_by_gallery: coaByGallery,
      coa_by_authenticating_body: coaByAuthenticatingBody,
      eligible: eligible,
      location_id: locationId,
      artsy_shipping_domestic: artsyShippingDomestic,
    }

    if (!createCommerceOptInEligibleArtworksReportLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await createCommerceOptInEligibleArtworksReportLoader(
        id,
        gravityOptions
      )
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
