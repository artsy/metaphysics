import { ContextModule } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { connectionFromArray } from "graphql-relay"
import type { HomeViewCard } from "../sectionTypes/Card"

const auctionsHubCards: HomeViewCard[] = [
  {
    title: "Your Auction Picks",
    href: "/your-auction-picks",
    entityType: "AuctionPicks",
    imageURL: "https://cdn.artsy.net/auction-picks.jpg",
  },
  {
    title: "Browse All Auctions",
    href: "/auctions",
    entityType: "Auctions",
    imageURLs: [
      "https://cdn.artsy.net/auctions-1.jpg",
      "https://cdn.artsy.net/auctions-2.jpg",
      "https://cdn.artsy.net/auctions-3.jpg",
    ],
  },
  {
    title: "Latest Auction Results",
    href: "/latest-auction-results",
    entityType: "AuctionResults",
  },
]

export const AuctionsHub: HomeViewSection = {
  id: "home-view-section-auctions-hub",
  contextModule: ContextModule.auctionRail,
  type: HomeViewSectionTypeNames.HomeViewSectionCards,
  component: {
    title: "Auctions Hub",
    type: "3UpImageLayout",
  },
  requiresAuthentication: false,
  featureFlag: "onyx_auctions_hub",
  resolver: (_parent, args, _context, _info) => {
    return connectionFromArray(auctionsHubCards, args)
  },
}
