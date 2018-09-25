import { GraphQLNonNull, GraphQLString } from "graphql"
import { BiddingMessages } from "./bidder_position_messages"
import { BidderPositionResultType } from "../types/bidder_position_result"

const ANY_RESERVE_MET_STATUSES = ["no_reserve", "reserve_met"]

const anyReserveMet = position => {
  return (
    ANY_RESERVE_MET_STATUSES.indexOf(position.sale_artwork.reserve_status) > -1
  )
}

export const BidderPosition = {
  type: BidderPositionResultType,
  description: "Returns a single bidder position",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (root, { id }, request, { rootValue: { meBidderPositionLoader } }) =>
    meBidderPositionLoader({
      id,
    }).then(response => {
      const position = response.body
      let status
      if (anyReserveMet(position) && position.processed_at && position.active) {
        return {
          status: "WINNING",
          position,
        }
      } else if (!position.processed_at) {
        return {
          status: "PENDING",
          position,
        }
      } else if (position.processed_at && !anyReserveMet(position)) {
        status = "RESERVE_NOT_MET"
      } else if (position.processed_at && !position.active) {
        status = "OUTBID"
      } else {
        status = "ERROR"
      }
      const message =
        BiddingMessages.find(d => status.trim().startsWith(d.id)) ||
        BiddingMessages[BiddingMessages.length - 1] // error
      return {
        status,
        message_header: message.header,
        message_description_md: message.description_md(),
        position,
      }
    }),
}
