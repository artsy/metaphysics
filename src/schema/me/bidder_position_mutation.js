// @ts-check

import { GraphQLString, GraphQLFloat, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"

import BidderPosition from "schema/bidder_position"

export const BidderPositionMutation = mutationWithClientMutationId({
  name: "BidderPosition",
  description:
    "Creates a bidder position",
  inputFields: {
    sale_id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    artwork_id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    max_bid_amount_cents: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
  },
  outputFields: {
    position: {
      type: BidderPosition.type,
      resolve: (position) => position,
    },
  },
  mutateAndGetPayload: (
    { sale_id, artwork_id, max_bid_amount_cents },
    _request,
    {
      rootValue: {
        accessToken,
        createBidderPositionLoader,
      },
    }
  ) => {
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }
    return createBidderPositionLoader({ sale_id, artwork_id, max_bid_amount_cents })
      .then(p => p)
      .catch((e) => {
        const errorSplit = e.message.split(" - ")
        const errorObject = errorSplit.length > 1 ? JSON.parse(e.message.split(" - ")[1]) : null
        if (errorObject && errorObject.type === "param_error") {
          return {
            id: "BID_NOT_HIGH_ENOUGH",
            message: errorObject ? errorObject.message : e.message,
          }
        }
        return new Error(e)
      })
  },
})
