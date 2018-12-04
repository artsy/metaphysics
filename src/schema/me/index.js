import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLList,
  GraphQLString,
  GraphQLObjectType,
} from "graphql"

import { IDFields, NodeInterface } from "schema/object_identification"
import { queriedForFieldsOtherThanBlacklisted } from "lib/helpers"

import date from "schema/fields/date"
import initials from "schema/fields/initials"

import ArtworkInquiries from "./artwork_inquiries"
import BidderPositions from "./bidder_positions"
import Bidders from "./bidders"
import BidderStatus from "./bidder_status"
import { BidderPosition } from "./bidder_position"
import CollectorProfile from "./collector_profile"
import Conversation from "./conversation"
import Conversations from "./conversations"
import { CreditCards } from "./credit_cards"
import FollowArtists from "./follow_artists"
import FollowedArtistsArtworkGroups from "./followed_artists_artworks_group"
import FollowedArtists from "./followed_artists"
import FollowedGenes from "./followed_genes"
import Invoice from "./conversation/invoice"
import LotStanding from "./lot_standing"
import LotStandings from "./lot_standings"
import Notifications from "./notifications"
import { RecentlyViewedArtworks } from "./recently_viewed_artworks"
import SaleRegistrations from "./sale_registrations"
import SavedArtworks from "./saved_artworks"
import SuggestedArtists from "./suggested_artists"
import Submissions from "./consignments/submissions"
import config from "config"

const { ENABLE_CONVECTION_STITCHING } = config

const mySubmissions = !!ENABLE_CONVECTION_STITCHING
  ? {}
  : { consignment_submissions: Submissions }

const Me = new GraphQLObjectType({
  name: "Me",
  interfaces: [NodeInterface],
  fields: {
    ...IDFields,
    ...mySubmissions,
    artwork_inquiries_connection: ArtworkInquiries,
    bidders: Bidders,
    bidder_status: BidderStatus,
    bidder_positions: BidderPositions,
    bidder_position: BidderPosition,
    collector_profile: CollectorProfile,
    conversation: Conversation,
    conversations: Conversations,
    created_at: date,
    creditCards: CreditCards,
    email: {
      type: GraphQLString,
    },
    follow_artists: FollowArtists,
    followed_artists_connection: FollowedArtists,
    followed_genes: FollowedGenes,
    followsAndSaves: {
      type: new GraphQLObjectType({
        name: "FollowsAndSaves",
        fields: {
          bundledArtworksByArtist: FollowedArtistsArtworkGroups,
        },
      }),
      resolve: () => ({}),
    },
    has_credit_cards: {
      type: GraphQLBoolean,
      resolve: (
        root,
        options,
        request,
        { rootValue: { meCreditCardsLoader } }
      ) => {
        return meCreditCardsLoader().then(({ body }) => {
          return body && body.length > 0
        })
      },
    },
    has_qualified_credit_cards: {
      type: GraphQLBoolean,
      resolve: (
        root,
        options,
        request,
        { rootValue: { meCreditCardsLoader } }
      ) => {
        return meCreditCardsLoader({ qualified_for_bidding: true }).then(
          ({ body }) => {
            return body && body.length > 0
          }
        )
      },
    },
    invoice: Invoice,
    lot_standing: LotStanding,
    lot_standings: LotStandings,
    name: {
      type: GraphQLString,
    },
    initials: initials("name"),
    notifications_connection: Notifications,
    paddle_number: {
      type: GraphQLString,
    },
    recentlyViewedArtworkIds: {
      type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
      resolve: ({ recently_viewed_artwork_ids }) => recently_viewed_artwork_ids,
    },
    recentlyViewedArtworks: RecentlyViewedArtworks,
    sale_registrations: SaleRegistrations,
    saved_artworks: SavedArtworks,
    suggested_artists: SuggestedArtists,
    type: {
      type: GraphQLString,
    },
  },
})

export default {
  type: Me,
  resolve: (
    root,
    options,
    request,
    { rootValue: { accessToken, userID, meLoader }, fieldNodes }
  ) => {
    if (!accessToken) return null
    const blacklistedFields = [
      "id",
      "__id",
      "creditCards",
      "follow_artists",
      "followed_artists_connection",
      "followed_genes",
      "has_credit_cards",
      "has_qualified_credit_cards",
      "suggested_artists",
      "bidders",
      "bidder_positions",
      "bidder_position",
      "bidder_status",
      "lot_standing",
      "lot_standings",
      "sale_registrations",
      "conversation",
      "conversations",
      "collector_profile",
      "artwork_inquiries_connection",
      "notifications_connection",
      "consignment_submissions",
      "followsAndSaves",
      "saved_artworks",
    ]
    if (queriedForFieldsOtherThanBlacklisted(fieldNodes, blacklistedFields)) {
      return meLoader().catch(() => null)
    }
    // The email and is_collector are here so that the type system's `isTypeOf`
    // resolves correctly when we're skipping gravity data
    return { id: userID, email: null, is_collector: null }
  },
}
