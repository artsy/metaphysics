import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLBoolean,
  GraphQLInt,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import ShippingPreset, {
  DomesticTypeEnum,
  InternationalTypeEnum,
} from "schema/v2/shippingPreset"
import { isUndefined, omitBy } from "lodash"

interface UpdateShippingPresetMutationInputProps {
  id: string
  name?: string
  domesticShippingFeeCents?: number
  domesticType?: string
  internationalShippingFeeCents?: number
  internationalType?: string
  pickupAvailable?: boolean
  artsyShippingDomestic?: boolean
  artsyShippingInternational?: boolean
  priceCurrency?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateShippingPresetSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    shippingPreset: {
      type: ShippingPreset.type,
      resolve: (shippingPreset) => shippingPreset,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateShippingPresetFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateShippingPresetResponseOrError",
  types: [SuccessType, FailureType],
})

export const updateShippingPresetMutation = mutationWithClientMutationId<
  UpdateShippingPresetMutationInputProps,
  any,
  ResolverContext
>({
  name: "UpdateShippingPresetMutation",
  description: "Updates a shipping preset for a partner.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the shipping preset to update.",
    },
    name: {
      type: GraphQLString,
      description: "The name of the shipping preset.",
    },
    domesticShippingFeeCents: {
      type: GraphQLInt,
      description: "Domestic shipping fee in cents.",
    },
    domesticType: {
      type: DomesticTypeEnum,
      description: "The type of domestic shipping option.",
    },
    internationalShippingFeeCents: {
      type: GraphQLInt,
      description: "International shipping fee in cents.",
    },
    internationalType: {
      type: InternationalTypeEnum,
      description: "The type of international shipping option.",
    },
    pickupAvailable: {
      type: GraphQLBoolean,
      description: "Whether pickup is available.",
    },
    artsyShippingDomestic: {
      type: GraphQLBoolean,
      description: "Whether Artsy handles domestic shipping.",
    },
    artsyShippingInternational: {
      type: GraphQLBoolean,
      description: "Whether Artsy handles international shipping.",
    },
    priceCurrency: {
      type: GraphQLString,
      description: "Currency of the shipping fee",
    },
  },
  outputFields: {
    shippingPresetOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the updated shipping preset. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id, ...args },
    { updateShippingPresetLoader }
  ) => {
    if (!updateShippingPresetLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const gravityArgs = omitBy(
      {
        name: args.name,
        domestic_shipping_fee_cents: args.domesticShippingFeeCents,
        domestic_type: args.domesticType,
        international_shipping_fee_cents: args.internationalShippingFeeCents,
        international_type: args.internationalType,
        pickup_available: args.pickupAvailable,
        artsy_shipping_domestic: args.artsyShippingDomestic,
        artsy_shipping_international: args.artsyShippingInternational,
        price_currency: args.priceCurrency,
      },
      isUndefined
    )

    try {
      const response = await updateShippingPresetLoader(id, gravityArgs)

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
