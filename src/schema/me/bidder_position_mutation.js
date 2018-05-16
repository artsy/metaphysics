// @ts-check

import { GraphQLString, GraphQLFloat, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"

import { BidderPositionResultType } from "../types/bidder_position_result"
import { BiddingMessages } from "./bidder_position_messages"
import config from "config"

const { PREDICTION_ENDPOINT } = config

// @ts-ignore
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
    result: {
      type: BidderPositionResultType,
      resolve: (result) => result,
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
      .then(p => { return { status: "SUCCESS", position: p } })
      .catch(e => {
        const errorSplit = e.message.split(" - ")
        const errorObject = errorSplit.length > 1 ? JSON.parse(e.message.split(" - ")[1]) : null
        if (errorObject) {
          const errorMessage = errorObject.message || errorObject.error
          const error = BiddingMessages.find(d => errorMessage.trim().startsWith(d.gravity_key)) ||
            errorObject.ERROR_UNKNOWN
          const liveAuctionUrl = `${PREDICTION_ENDPOINT}/${sale_id}`
          return {
            status: error.id,
            message_header: error.header,
            message_description_md: error.description_md({ liveAuctionUrl }),
          }
        }
        return new Error(e)
      })
  },
})
