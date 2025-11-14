import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"
import {
  NodeInterface,
  InternalIDFields,
} from "schema/v2/object_identification"
import date from "schema/v2/fields/date"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"

export const ShippingPresetType = new GraphQLObjectType<any, ResolverContext>({
  name: "ShippingPreset",
  interfaces: [NodeInterface],
  fields: () => ({
    ...InternalIDFields,
    name: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The name of the shipping preset",
      resolve: ({ name }) => name,
    },
    partnerID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner this shipping preset belongs to",
      resolve: ({ partner_id }) => partner_id,
    },
    domesticShippingFeeCents: {
      type: GraphQLInt,
      description: "Domestic shipping fee in cents",
      resolve: ({ domestic_shipping_fee_cents }) => domestic_shipping_fee_cents,
    },
    internationalShippingFeeCents: {
      type: GraphQLInt,
      description: "International shipping fee in cents",
      resolve: ({ international_shipping_fee_cents }) =>
        international_shipping_fee_cents,
    },
    pickupAvailable: {
      type: GraphQLBoolean,
      description: "Whether pickup is available",
      resolve: ({ pickup_available }) => pickup_available,
    },
    artsyShippingDomestic: {
      type: GraphQLBoolean,
      description: "Whether Artsy handles domestic shipping",
      resolve: ({ artsy_shipping_domestic }) => artsy_shipping_domestic,
    },
    artsyShippingInternational: {
      type: GraphQLBoolean,
      description: "Whether Artsy handles international shipping",
      resolve: ({ artsy_shipping_international }) =>
        artsy_shipping_international,
    },
    createdAt: date,
    updatedAt: date,
  }),
})

const ShippingPreset: GraphQLFieldConfig<void, ResolverContext> = {
  type: ShippingPresetType,
  description: "A ShippingPreset",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the ShippingPreset",
    },
  },
  resolve: (_root, { id }, { shippingPresetLoader }) => {
    if (!shippingPresetLoader) {
      throw new Error("ShippingPreset loader is not available")
    }
    return shippingPresetLoader(id)
  },
}

export default ShippingPreset
export const ShippingPresetsConnection = connectionWithCursorInfo({
  nodeType: ShippingPresetType,
})
