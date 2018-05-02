// @ts-check

import { GraphQLString, GraphQLFloat, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"

import BidderPosition from "schema/bidder_position"

const biddingErrors = [
  {
    id: "ERROR_BID_LOW",
    gravity_key: "Please enter a bid higher than",
    header: "Your bid wasn't high enough",
    description: `Another bidder placed a higher max bid or the same max bid before you did.
     Bid again to take the lead.`,
  },
  {
    id: "ERROR_SALE_CLOSED",
    gravity_key: "Sale Closed to Bids",
    header: "Lot closed",
    description: "Sorry, your bid wasn’t received before the lot closed.",
  },
  {
    id: "ERROR_CONNECTION",
    greavity_key: "Please check your network connectivity and try again",
    header: "An error occurred",
    description: "Your bid couldn’t be placed. Please check your internet connection and try again.",
  },
  {
    id: "ERROR_LIVE_BIDDING_STARTED",
    gravity_key: "Live Bidding has Started",
    header: "Live bidding has started",
    // TODO link
    description: `Sorry, your bid wasn’t received before live bidding started.
     To continue bidding, please join the live auction.`,
  },
  {
    id: "ERROR_BIDDER_NOT_QUALIFIED",
    greavity_key: "Bidder not qualified to bid on this auction.",
    header: "Bid not placed",
    // TODO link
    description: `Your bid can’t be placed at this time.
      Please contact support@artsy.net for more information.`,
  },
  {
    id: "ERROR_UNKNOWN",
    greavity_key: "unknown error",
    header: "Bid not placed",
    // TODO link
    description: `Your bid can’t be placed at this time.
      Please contact support@artsy.net for more information.`,

  },
]

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
      .catch((e) => {
        const errorSplit = e.message.split(" - ")
        const errorObject = errorSplit.length > 1 ? JSON.parse(e.message.split(" - ")[1]) : null
        if (errorObject && errorObject.type === "param_error") {
          const error = biddingErrors.find(d => errorObject.message.startsWith(d.gravity_key)) ||
            errorObject.ERROR_UNKNOWN
          return {
            id: error.id,
            message_header: error.header,
            message_description: error.description,

          }
        }
        return new Error(e)
      })
  },
})
