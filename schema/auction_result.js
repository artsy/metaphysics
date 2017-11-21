import date from "./fields/date"
import { amount } from "./fields/money"
import { IDFields, NodeInterface } from "./object_identification"
import { GraphQLFloat, GraphQLNonNull, GraphQLString, GraphQLObjectType } from "graphql"
import { connectionDefinitions } from "graphql-relay"
import { has } from "lodash"

const AuctionResultType = new GraphQLObjectType({
  name: "AuctionResult",
  interfaces: [NodeInterface],
  isTypeOf: obj => has(obj, "dimension_text") && has(obj, "organization"),
  fields: () => ({
    ...IDFields,
    title: {
      type: GraphQLString,
    },
    artist_id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    date,
    date_text: {
      type: GraphQLString,
    },
    medium_text: {
      type: GraphQLString,
    },
    category_text: {
      type: GraphQLString,
    },
    dimension_text: {
      type: GraphQLString,
    },
    dimensions: {
      type: new GraphQLObjectType({
        name: "AuctionLotDimensions",
        description: "In centimeters.",
        fields: {
          width: {
            type: GraphQLFloat,
          },
          height: {
            type: GraphQLFloat,
          },
          depth: {
            type: GraphQLFloat,
          },
        },
      }),
      resolve: ({ width_cm, height_cm, depth_cm }) => {
        return { width: width_cm, height: height_cm, depth: depth_cm }
      },
    },
    organization: {
      type: GraphQLString,
    },
    sale_date: date,
    sale_date_text: {
      type: GraphQLString,
    },
    sale_title: {
      type: GraphQLString,
    },
    currency: {
      type: GraphQLString,
    },
    description: {
      type: GraphQLString,
    },
    external_url: {
      type: GraphQLString,
    },
    low_estimate: amount(({ low_estimate_cents_usd }) => low_estimate_cents_usd),
    high_estimate: amount(({ high_estimate_cents_usd }) => high_estimate_cents_usd),
    price_realized: amount(({ price_realized_cents_usd }) => price_realized_cents_usd),
  }),
})

export const auctionResultConnection = connectionDefinitions({
  nodeType: AuctionResultType,
}).connectionType
