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
import ShippingPreset from "../shippingPreset"

interface CreateShippingPresetMutationInputProps {
  partnerId: string
  name: string
  domesticShippingFeeCents?: number
  internationalShippingFeeCents?: number
  pickupAvailable?: boolean
  artsyShippingDomestic?: boolean
  artsyShippingInternational?: boolean
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
    internationalShippingFeeCents: {
      type: GraphQLInt,
      description: "International shipping fee in cents.",
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
      partner_id: string
      name: string
      domestic_shipping_fee_cents?: number
      international_shipping_fee_cents?: number
      pickup_available?: boolean
      artsy_shipping_domestic?: boolean
      artsy_shipping_international?: boolean
    } = {
      partner_id: partnerId,
      name: args.name,
      domestic_shipping_fee_cents: args.domesticShippingFeeCents,
      international_shipping_fee_cents: args.internationalShippingFeeCents,
      pickup_available: args.pickupAvailable,
      artsy_shipping_domestic: args.artsyShippingDomestic,
      artsy_shipping_international: args.artsyShippingInternational,
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
