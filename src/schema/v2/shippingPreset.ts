import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLEnumType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import {
  NodeInterface,
  InternalIDFields,
} from "schema/v2/object_identification"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"
import { date } from "./fields/date"

export const DomesticTypeEnum = new GraphQLEnumType({
  name: "DomesticType",
  description: "The type of domestic shipping option",
  values: {
    ARTSY_SHIPPING: {
      value: "artsy_shipping",
      description: "Artsy handles domestic shipping",
    },
    FLAT_FEE: {
      value: "flat_fee",
      description: "Flat fee for domestic shipping",
    },
    FREE_SHIPPING: {
      value: "free_shipping",
      description: "Free domestic shipping",
    },
  },
})

export const InternationalTypeEnum = new GraphQLEnumType({
  name: "InternationalType",
  description: "The type of international shipping option",
  values: {
    ARTSY_SHIPPING: {
      value: "artsy_shipping",
      description: "Artsy handles international shipping",
    },
    FLAT_FEE: {
      value: "flat_fee",
      description: "Flat fee for international shipping",
    },
    FREE_SHIPPING: {
      value: "free_shipping",
      description: "Free international shipping",
    },
    NOT_SUPPORTED: {
      value: "not_supported",
      description: "International shipping is not supported",
    },
  },
})

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
    priceCurrency: {
      type: GraphQLString,
      description: "Currency of the shipping fee",
      resolve: ({ price_currency }) => price_currency,
    },
    domesticType: {
      type: DomesticTypeEnum,
      description: "The type of domestic shipping option",
      resolve: ({ domestic_type }) => domestic_type,
    },
    internationalType: {
      type: InternationalTypeEnum,
      description: "The type of international shipping option",
      resolve: ({ international_type }) => international_type,
    },
    createdAt: date(({ created_at }) => created_at),
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
