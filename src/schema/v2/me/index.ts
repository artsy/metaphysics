import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLList,
  GraphQLString,
  GraphQLObjectType,
  GraphQLFieldConfig,
  GraphQLInt,
} from "graphql"

import { IDFields, NodeInterface } from "schema/v2/object_identification"
import { includesFieldsOtherThanSelectionSet } from "lib/hasFieldSelection"

import date from "schema/v2/fields/date"
import initials from "schema/v2/fields/initials"

import ArtworkInquiries from "./artwork_inquiries"
import BidderPositions from "./bidder_positions"
import Bidders from "./bidders"
import BidderStatus from "./bidder_status"
import { BidderPosition } from "./bidder_position"
import CollectorProfile from "./collector_profile"
import Conversation from "./conversation"
import Conversations from "./conversations"
import { CreditCards } from "./credit_cards"
import FollowedArtistsArtworkGroups from "./followed_artists_artworks_group"
import FollowedArtists from "./followed_artists"
import FollowedGenes from "./followed_genes"
import FollowedShows from "./followed_shows"
import FollowedFairs from "./followed_fairs"
import Invoice from "./conversation/invoice"
import LotStanding from "./lot_standing"
import LotStandings from "./lot_standings"
import { RecentlyViewedArtworks } from "./recently_viewed_artworks"
import SaleRegistrationsConnection from "./sale_registrations"
import { SavedArtworks } from "./savedArtworks"
import { ResolverContext } from "types/graphql"
import { SaleArtworksConnectionField } from "../sale_artworks"
import {
  IdentityVerification,
  PendingIdentityVerification,
} from "./identity_verification"
import { MyCollection } from "./myCollection"
import FollowedGalleries from "./followed_galleries"
import { WatchedLotConnection } from "./watchedLotConnection"

const Me = new GraphQLObjectType<any, ResolverContext>({
  name: "Me",
  interfaces: [NodeInterface],
  fields: {
    ...IDFields,
    artworkInquiriesConnection: ArtworkInquiries,
    bidders: Bidders,
    bidderStatus: BidderStatus,
    bidderPositions: BidderPositions,
    bidderPosition: BidderPosition,
    collectorProfile: CollectorProfile,
    conversation: Conversation,
    conversationsConnection: Conversations,
    createdAt: date,
    creditCards: CreditCards,
    email: {
      type: GraphQLString,
    },
    emailFrequency: {
      description: "Frequency of marketing emails.",
      resolve: ({ email_frequency }) => email_frequency,
      type: GraphQLString,
    },
    canRequestEmailConfirmation: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "Whether user is allowed to request email confirmation",
      resolve: ({ can_request_email_confirmation }) =>
        can_request_email_confirmation,
    },
    followsAndSaves: {
      type: new GraphQLObjectType<any, ResolverContext>({
        name: "FollowsAndSaves",
        fields: {
          bundledArtworksByArtistConnection: FollowedArtistsArtworkGroups,
          artistsConnection: FollowedArtists,
          artworksConnection: SavedArtworks,
          fairsConnection: FollowedFairs,
          galleriesConnection: FollowedGalleries,
          genesConnection: FollowedGenes,
          showsConnection: FollowedShows,
        },
      }),
      resolve: () => ({}),
    },
    hasCreditCards: {
      type: GraphQLBoolean,
      resolve: (_root, _options, { meCreditCardsLoader }) => {
        if (!meCreditCardsLoader) return null
        return meCreditCardsLoader().then(({ body }) => {
          return body && body.length > 0
        })
      },
    },
    hasPassword: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: ({ has_password }) => has_password,
    },
    hasQualifiedCreditCards: {
      type: GraphQLBoolean,
      resolve: (_root, _options, { meCreditCardsLoader }) => {
        if (!meCreditCardsLoader) return null
        return meCreditCardsLoader({ qualified_for_bidding: true }).then(
          ({ body }) => {
            return body && body.length > 0
          }
        )
      },
    },
    hasSecondFactorEnabled: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: ({ second_factor_enabled }) => second_factor_enabled,
    },
    invoice: Invoice,
    identityVerification: IdentityVerification,
    identityVerified: {
      type: GraphQLBoolean,
      resolve: ({ identity_verified }) => identity_verified,
    },
    labFeatures: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      description: "List of lab features for this user",
      resolve: ({ lab_features }) => lab_features || [],
    },
    lotsByFollowedArtistsConnection: SaleArtworksConnectionField,
    lotStanding: LotStanding,
    lotStandings: LotStandings,
    myCollectionConnection: MyCollection,
    name: {
      type: GraphQLString,
    },
    initials: initials("name"),
    paddleNumber: {
      type: GraphQLString,
      resolve: ({ paddle_number }) => paddle_number,
    },
    pendingIdentityVerification: PendingIdentityVerification,
    phone: {
      type: GraphQLString,
    },
    receivePurchaseNotification: {
      description: "This user should receive purchase notifications",
      type: GraphQLBoolean,
      resolve: ({ receive_purchase_notification }) =>
        receive_purchase_notification,
    },
    receiveOutbidNotification: {
      description: "This user should receive outbid notifications",
      type: GraphQLBoolean,
      resolve: ({ receive_outbid_notification }) => receive_outbid_notification,
    },
    receiveLotOpeningSoonNotification: {
      description: "This user should receive lot opening notifications",
      type: GraphQLBoolean,
      resolve: ({ receive_lot_opening_soon_notification }) =>
        receive_lot_opening_soon_notification,
    },
    receiveSaleOpeningClosingNotification: {
      description:
        "This user should receive sale opening/closing notifications",
      type: GraphQLBoolean,
      resolve: ({ receive_sale_opening_closing_notification }) =>
        receive_sale_opening_closing_notification,
    },
    receiveNewWorksNotification: {
      description: "This user should receive new works notifications",
      type: GraphQLBoolean,
      resolve: ({ receive_new_works_notification }) =>
        receive_new_works_notification,
    },
    receiveNewSalesNotification: {
      description: "This user should receive new sales notifications",
      type: GraphQLBoolean,
      resolve: ({ receive_new_sales_notification }) =>
        receive_new_sales_notification,
    },
    receivePromotionNotification: {
      description: "This user should receive promotional notifications",
      type: GraphQLBoolean,
      resolve: ({ receive_promotion_notification }) =>
        receive_promotion_notification,
    },
    recentlyViewedArtworkIds: {
      type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
      resolve: ({ recently_viewed_artwork_ids }) => recently_viewed_artwork_ids,
    },
    recentlyViewedArtworksConnection: RecentlyViewedArtworks,
    saleRegistrationsConnection: SaleRegistrationsConnection,
    type: {
      type: GraphQLString,
    },
    unreadNotificationsCount: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "A count of unread notifications.",
      resolve: (_root, options, { notificationsFeedLoader }) => {
        if (!notificationsFeedLoader)
          throw new Error("You need to be signed in to perform this action")

        return notificationsFeedLoader(options).then(({ total_unread }) => {
          return total_unread || 0
        })
      },
    },
    unreadConversationCount: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "The count of conversations with unread messages.",
      resolve: (_root, _options, { conversationsLoader }) => {
        if (!conversationsLoader) return 0
        const expand = ["total_unread_count"]
        return conversationsLoader({ page: 1, size: 0, expand }).then(
          ({ total_unread_count }) => total_unread_count
        )
      },
    },
    watchedLotConnection: WatchedLotConnection,
  },
})

const MeField: GraphQLFieldConfig<void, ResolverContext> = {
  type: Me,
  resolve: (_root, _options, { userID, meLoader }, info) => {
    if (!meLoader) return null
    const fieldsNotRequireLoader = [
      "id",
      "internalID",
      "creditCards",
      "hasCreditCards",
      "hasQualifiedCreditCards",
      "bidders",
      "bidderPositions",
      "bidderPosition",
      "bidderStatus",
      "lotStanding",
      "lotStandings",
      "saleRegistrationsConnection",
      "conversation",
      "conversations",
      "collectorProfile",
      "artworkInquiries",
      "followsAndSaves",
      "lotsByFollowedArtistsConnection",
      "identityVerification",
      "unreadNotificationsCount",
    ]
    if (includesFieldsOtherThanSelectionSet(info, fieldsNotRequireLoader)) {
      return meLoader()
    }
    // The email and is_collector are here so that the type system's `isTypeOf`
    // resolves correctly when we're skipping gravity data
    return { id: userID, email: null, is_collector: null }
  },
}

export default MeField
