// the description_md must be a function to delay interpolation of string literal
export const BiddingMessages = [
  {
    id: "OUTBID",
    gravity_key: "Please enter a bid higher than",
    header: "Your bid wasn't high enough",
    description_md: () =>
      "Another bidder placed a higher max bid or the same max bid before you did.  \
 Bid again to take the lead.",
  },
  {
    id: "RESERVE_NOT_MET",
    gravity_key: "Please enter a bid higher than",
    header: "Your bid wasn't high enough",
    description_md: () =>
      "Your bid didn’t meet the reserve price for this work.  \
 Bid again to take the lead.",
  },
  {
    id: "SALE_CLOSED",
    gravity_key: "Sale Closed to Bids",
    header: "Lot closed",
    description_md: () =>
      "Sorry, your bid wasn’t received before the lot closed.",
  },
  {
    id: "LIVE_BIDDING_STARTED",
    gravity_key: "Live Bidding has Started",
    header: "Live bidding has started",
    description_md: params => `Sorry, your bid wasn’t received before live bidding started.\
 To continue bidding, please [join the live auction](${
   params.liveAuctionUrl
 }).`,
  },
  {
    id: "BIDDER_NOT_QUALIFIED",
    gravity_key: "Bidder not qualified to bid on this auction.",
    header: "Bid not placed",
    description_md: () =>
      "Your bid can’t be placed at this time.\
 Please contact [support@artsy.net](mailto:support@artsy.net) for more information.",
  },
  {
    id: "ERROR",
    gravity_key: "unknown error",
    header: "Bid not placed",
    description_md: () =>
      "Your bid can’t be placed at this time.\
 Please contact [support@artsy.net](mailto:support@artsy.net) for more information.",
  },
]
