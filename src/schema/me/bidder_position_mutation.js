// @ts-check

import { GraphQLString, GraphQLFloat } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"

export const BidderPositionMutation = mutationWithClientMutationId({
  name: "BidderPosition",
  description:
    "Creates a bidder position",
  inputFields: {
    sale_id: {
      type: GraphQLString,
    },
    artwork_id: {
      type: GraphQLString,
    },
    max_bid_amount_cents: {
      type: GraphQLFloat,
    },
  },
  outputFields: {
    sale_id: {
      type: GraphQLString,
      resolve: (position) => position.bidder.sale.id,
    },
  },
  mutateAndGetPayload: (
    { sale_id, artwork_id, max_bid_amount_cents },
    _request,
    {
      rootValue: {
        accessToken,
        meBidderPositionMutationLoader,
      },
    }
  ) => {
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }

    return meBidderPositionMutationLoader({ sale_id, artwork_id, max_bid_amount_cents })
  },
})
