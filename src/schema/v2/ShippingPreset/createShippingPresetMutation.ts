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

interface CreateShippingPresetMutationInputProps {
  artsyShippingDomestic?: boolean
  artsyShippingInternational?: boolean
  domesticShippingFeeCents?: number
  domesticType?: string
  internationalShippingFeeCents?: number
  internationalType?: string
  name: string
  partnerId: string
  pickupAvailable?: boolean
  priceCurrency?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateShippingPresetSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    shippingPreset: {
      type: ShippingPreset.type,
      resolve: (shippingPreset) => shippingPreset,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateShippingPresetFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateShippingPresetResponseOrError",
  types: [SuccessType, FailureType],
})

export const createShippingPresetMutation = mutationWithClientMutationId<
  CreateShippingPresetMutationInputProps,
  any,
  ResolverContext
>({
  name: "CreateShippingPresetMutation",
  description: "Creates a shipping preset for a partner.",
  inputFields: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner to create the shipping preset for.",
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
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
        "On success: the created shipping preset. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerId, ...args },
    { createShippingPresetLoader }
  ) => {
    if (!createShippingPresetLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const gravityArgs: {
      artsy_shipping_domestic?: boolean
      artsy_shipping_international?: boolean
      domestic_shipping_fee_cents?: number
      domestic_type?: string
      international_shipping_fee_cents?: number
      international_type?: string
      name: string
      partner_id: string
      pickup_available?: boolean
      price_currency?: string
    } = {
      artsy_shipping_domestic: args.artsyShippingDomestic,
      artsy_shipping_international: args.artsyShippingInternational,
      domestic_shipping_fee_cents: args.domesticShippingFeeCents,
      domestic_type: args.domesticType,
      international_shipping_fee_cents: args.internationalShippingFeeCents,
      international_type: args.internationalType,
      name: args.name,
      partner_id: partnerId,
      pickup_available: args.pickupAvailable,
      price_currency: args.priceCurrency,
    }

    try {
      const response = await createShippingPresetLoader(gravityArgs)

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
