import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLBoolean,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import Partner from "./partner"
import { ResolverContext } from "types/graphql"

interface UpdatePartnerFlagsMutationInputProps {
  id: string
  inquireAvailabilityPriceDisplayEnabledByPartner?: boolean | null
  artworksDefaultMetric?: string | null
  artworksDefaultCurrency?: string | null
  artworksDefaultPartnerLocationId?: string | null
  artworksDefaultWeightMetric?: string | null
  gdprDpaAccepted?: boolean | null
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerFlagsSuccess",
  isTypeOf: (data) => data._id,
  fields: () => ({
    partner: {
      type: Partner.type,
      resolve: (partner) => partner,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerFlagsFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdatePartnerFlagsResponseOrError",
  types: [SuccessType, FailureType],
})

export const updatePartnerFlagsMutation = mutationWithClientMutationId<
  UpdatePartnerFlagsMutationInputProps,
  any,
  ResolverContext
>({
  name: "UpdatePartnerFlagsMutation",
  description: "Updates multiple flags on a partner simultaneously.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the partner to update.",
    },
    inquireAvailabilityPriceDisplayEnabledByPartner: {
      type: GraphQLBoolean,
      description:
        "Controls whether the partner has enabled the inquire availability price display. If null, the flag will be unset.",
    },
    artworksDefaultMetric: {
      type: GraphQLString,
      description:
        "The default metric system to use for artworks. If null, the flag will be unset.",
    },
    artworksDefaultCurrency: {
      type: GraphQLString,
      description:
        "The default currency to use for artworks. If null, the flag will be unset.",
    },
    artworksDefaultPartnerLocationId: {
      type: GraphQLString,
      description:
        "The default partner location ID to use for artworks. If null, the flag will be unset.",
    },
    artworksDefaultWeightMetric: {
      type: GraphQLString,
      description:
        "The default weight metric system to use for artworks. If null, the flag will be unset.",
    },
    gdprDpaAccepted: {
      type: GraphQLBoolean,
      description:
        "Whether the partner has accepted the GDPR DPA. The server will record the acceptance timestamp.",
    },
  },
  outputFields: {
    partnerOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the updated partner. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    {
      id,
      inquireAvailabilityPriceDisplayEnabledByPartner,
      artworksDefaultMetric,
      artworksDefaultCurrency,
      artworksDefaultPartnerLocationId,
      artworksDefaultWeightMetric,
      gdprDpaAccepted,
    },
    { updatePartnerFlagsLoader }
  ) => {
    if (!updatePartnerFlagsLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      // Convert camelCase inputs to snake_case flags
      const flags = {}

      // Only include the flags if they're being set or explicitly unset
      if (inquireAvailabilityPriceDisplayEnabledByPartner !== undefined) {
        flags[
          "inquire_availability_price_display_enabled_by_partner"
        ] = inquireAvailabilityPriceDisplayEnabledByPartner
      }

      if (artworksDefaultMetric !== undefined) {
        flags["artworks_default_metric"] = artworksDefaultMetric
      }

      if (artworksDefaultCurrency !== undefined) {
        flags["artworks_default_currency"] = artworksDefaultCurrency
      }

      if (artworksDefaultPartnerLocationId !== undefined) {
        flags[
          "artworks_default_partner_location_id"
        ] = artworksDefaultPartnerLocationId
      }

      if (artworksDefaultWeightMetric !== undefined) {
        flags["artworks_default_weight_metric"] = artworksDefaultWeightMetric
      }

      if (gdprDpaAccepted !== undefined) {
        flags["gdpr_dpa_accepted"] = gdprDpaAccepted
      }

      const response = await updatePartnerFlagsLoader(id, { flags })
      return response
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
