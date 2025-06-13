import { GraphQLFloat, GraphQLString } from "graphql"

// Fields the `createPurchase` and `updatePurchase` mutations have in common.
export const PurchaseInputFields = {
  artsyCommission: {
    type: GraphQLFloat,
  },
  artworkID: {
    type: GraphQLString,
  },
  discoverAdminID: {
    type: GraphQLString,
  },
  email: {
    type: GraphQLString,
  },
  fairID: {
    type: GraphQLString,
  },
  note: {
    type: GraphQLString,
  },
  ownerID: {
    type: GraphQLString,
  },
  ownerType: {
    type: GraphQLString,
  },
  saleDate: {
    type: GraphQLString,
  },
  saleAdminID: {
    type: GraphQLString,
  },
  saleID: {
    type: GraphQLString,
  },
  salePrice: {
    type: GraphQLFloat,
    description: "Sale price in USD.",
  },
  source: {
    type: GraphQLString,
  },
  userID: {
    type: GraphQLString,
  },
}
