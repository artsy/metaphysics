// the description_md must be a function to delay interpolation of string literal

interface BiddingMessage {
  status:
    | "OUTBID"
    | "RESERVE_NOT_MET"
    | "SALE_CLOSED"
    | "LOT_CLOSED"
    | "LIVE_BIDDING_STARTED"
    | "BIDDER_NOT_QUALIFIED"
    | "ERROR"
  message: string
  header: string
  getDescription: (props?: { liveAuctionUrl: string }) => string
}

export const bidderPositionMessages: BiddingMessage[] = [
  {
    status: "OUTBID",
    message: "Please enter a bid higher than",
    header: "Your bid wasn’t high enough",
    getDescription: () =>
      `Another bidder placed a higher max bid or the same max bid before you did.`,
  },
  {
    status: "RESERVE_NOT_MET",
    message: "Please enter a bid higher than",
    header: "Your bid wasn’t high enough",
    getDescription: () =>
      `Your bid is below the reserve price. Please select a higher bid.`,
  },
  {
    status: "SALE_CLOSED",
    message: "Sale Closed to Bids",
    header: "Lot closed",
    getDescription: () =>
      "Sorry, your bid wasn’t received before the lot closed.",
  },
  {
    status: "LOT_CLOSED",
    message: "Lot Closed to Bids",
    header: "Lot closed",
    getDescription: () =>
      "Sorry, your bid wasn’t received before the lot closed.",
  },
  {
    status: "LIVE_BIDDING_STARTED",
    message: "Live Bidding has Started",
    header: "Live bidding has started",
    getDescription: (props) =>
      `Sorry, your bid wasn’t received before live bidding started. To continue bidding, please [join the live auction](${props?.liveAuctionUrl}).`,
  },
  {
    status: "BIDDER_NOT_QUALIFIED",
    message: "Bidder not qualified to bid on this auction.",
    header: "Bid not placed",
    getDescription: () =>
      `Your bid can't be placed at this time. Please contact [support@artsy.net](mailto:support@artsy.net) for more information.`,
  },
  {
    status: "ERROR",
    message: "unknown error",
    header: "Bid not placed",
    getDescription: () =>
      `Your bid can't be placed at this time. Please contact [support@artsy.net](mailto:support@artsy.net) for more information.`,
  },
]
