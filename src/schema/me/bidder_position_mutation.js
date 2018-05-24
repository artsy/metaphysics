// @ts-check

import { GraphQLString, GraphQLFloat, GraphQLObjectType, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"

import config from "config"
import BidderPosition from "schema/bidder_position"

const { PREDICTION_ENDPOINT } = config

// the description_md must be a function to delay interpolation of string literal
const biddingErrors = [
  {
    id: "ERROR_BID_LOW",
    gravity_key: "Please enter a bid higher than",
    header: "Your bid wasn't high enough",
    description_md: () => "Another bidder placed a higher max bid or the same max bid before you did.  \
 Bid again to take the lead.",
  },
  {
    id: "ERROR_SALE_CLOSED",
    gravity_key: "Sale Closed to Bids",
    header: "Lot closed",
    description_md: () => "Sorry, your bid wasn’t received before the lot closed.",
  },
  {
    id: "ERROR_LIVE_BIDDING_STARTED",
    gravity_key: "Live Bidding has Started",
    header: "Live bidding has started",
    description_md: params => `Sorry, your bid wasn’t received before live bidding started.\
 To continue bidding, please [join the live auction](${params.liveAuctionUrl}).`,
  },
  {
    id: "ERROR_BIDDER_NOT_QUALIFIED",
    gravity_key: "Bidder not qualified to bid on this auction.",
    header: "Bid not placed",
    description_md: () => "Your bid can’t be placed at this time.\
 Please contact [support@artsy.net](mailto:support@artsy.net) for more information.",

  },
  {
    id: "ERROR_UNKNOWN",
    gravity_key: "unknown error",
    header: "Bid not placed",
    description_md: () => "Your bid can’t be placed at this time.\
 Please contact [support@artsy.net](mailto:support@artsy.net) for more information.",
  },
]

const BidderPositionMutationResultType = new GraphQLObjectType({
  name: "BidderPositionMutationResult",
  fields: () => ({
    status: {
      type: new GraphQLNonNull(GraphQLString),
    },
    message_header: {
      type: GraphQLString,
    },
    message_description_md: {
      type: GraphQLString,
    },
    position: {
      type: BidderPosition.type,
    },
  }),
})

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
      type: BidderPositionMutationResultType,
      resolve: result => result,
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
    },
  ) => {
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }
    return createBidderPositionLoader({ sale_id, artwork_id, max_bid_amount_cents })
      .then(p => ({ status: "SUCCESS", position: p }))
      .catch((e) => {
        const errorSplit = e.message.split(" - ")
        const errorObject = errorSplit.length > 1 ? JSON.parse(e.message.split(" - ")[1]) : null
        if (errorObject) {
          const errorMessage = errorObject.message || errorObject.error
          const error = biddingErrors.find(d => errorMessage.trim().startsWith(d.gravity_key)) ||
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
