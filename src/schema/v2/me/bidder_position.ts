import { GraphQLNonNull, GraphQLString, GraphQLFieldConfig } from "graphql"
import { bidderPositionMessages } from "./bidder_position_messages"
import { BidderPositionResultType } from "../types/bidder_position_result"
import { ResolverContext } from "types/graphql"
import { last } from "lodash"

const ANY_RESERVE_MET_STATUSES = ["no_reserve", "reserve_met"]

const anyReserveMet = (position) => {
  return (
    ANY_RESERVE_MET_STATUSES.indexOf(position.sale_artwork.reserve_status) > -1
  )
}

export const BidderPosition: GraphQLFieldConfig<void, ResolverContext> = {
  type: BidderPositionResultType,
  description: "Returns a single bidder position",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (_root, { id }, { meBidderPositionLoader }) =>
    !meBidderPositionLoader
      ? null
      : meBidderPositionLoader(id).then((response) => {
          const position = response.body
          let status
          if (
            anyReserveMet(position) &&
            position.processed_at &&
            position.active
          ) {
            return {
              status: "WINNING",
              position,
            }
          } else if (
            position.errors &&
            position.errors.includes("Lot must be open")
          ) {
            if (position.bidder.sale.auction_state === "open") {
              status = "LOT_CLOSED"
            } else {
              status = "SALE_CLOSED"
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

          const message = bidderPositionMessages.find((bidderPositionMessage) =>
            status.startsWith(bidderPositionMessage.status)
          )

          if (!message) {
            return last(bidderPositionMessages)
          }

          const formattedMessage = {
            status,
            messageHeader: message.header,
            messageDescriptionMD: message.getDescription(),
            position,
          }

          return formattedMessage
        }),
}
