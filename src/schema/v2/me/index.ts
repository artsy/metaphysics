import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { includesFieldsOtherThanSelectionSet } from "lib/hasFieldSelection"
import { StaticPathLoader } from "lib/loaders/api/loader_interface"
import date from "schema/v2/fields/date"
import initials from "schema/v2/fields/initials"
import { IDFields, NodeInterface } from "schema/v2/object_identification"
import { ResolverContext } from "types/graphql"
import Image from "../image"
import { PhoneNumber } from "../phoneNumber"
import { SaleArtworksConnectionField } from "../sale_artworks"
import { ArtistRecommendations } from "./artistRecommendations"
import { ArtworkRecommendations } from "./artworkRecommendations"
import ArtworkInquiries from "./artwork_inquiries"
import AuctionResultsByFollowedArtists from "./auction_results_by_followed_artists"
import { authentications } from "./authentications"
import { BankAccounts } from "./bank_accounts"
import Bidders from "./bidders"
import { BidderPosition } from "./bidder_position"
import BidderPositions from "./bidder_positions"
import BidderStatus from "./bidder_status"
import { CollectorProfile } from "../CollectorProfile/collectorProfile"
import Conversation from "schema/v2/conversation"
import Invoice from "schema/v2/conversation/invoice"
import Conversations from "schema/v2/conversation/conversations"
import { CreditCards } from "./credit_cards"
import { followedProfiles } from "./followedProfiles"
import FollowedArtists from "./followed_artists"
import FollowedArtistsArtworkGroups from "./followed_artists_artworks_group"
import FollowedFairs from "./followed_fairs"
import FollowedGalleries from "./followed_galleries"
import FollowedGenes from "./followed_genes"
import FollowedShows from "./followed_shows"
import {
  IdentityVerification,
  PendingIdentityVerification,
} from "../identityVerification"
import LotStanding from "./lot_standing"
import LotStandings from "./lot_standings"
import { MyBids } from "./myBids"
import { MyCollection } from "./myCollection"
import MyCollectionAuctionResults from "./myCollectionAuctionResults"
import { MyCollectionInfo } from "./myCollectionInfo"
import { myLocationType } from "./myLocation"
import { NewWorksByInterestingArtists } from "./newWorksByInterestingArtists"
import { ManagedPartners } from "./partners"
import { RecentlyViewedArtworks } from "./recently_viewed_artworks"
import { SaleRegistrationConnection } from "./sale_registrations"
import { SavedArtworks } from "./savedArtworks"
import { ShowsByFollowedArtists } from "./showsByFollowedArtists"
import { WatchedLotConnection } from "./watchedLotConnection"
import { quiz } from "../quiz"

/**
 * @deprecated: Please use the CollectorProfile type instead of adding fields to me directly.
 */
const collectorProfileResolver = (field: string) => async (
  _root,
  options,
  {
    meCollectorProfileLoader,
  }: { meCollectorProfileLoader?: StaticPathLoader<any> }
) => {
  if (!meCollectorProfileLoader) {
    throw new Error("You need to be signed in to perform this action")
  }

  const result = await meCollectorProfileLoader(options)
  return result?.[field]
}

// These default values are only necessary due to caching issues in Gravity.
// Normally Gravity should always send values for these preferences.
const DEFAULT_CURRENCY_PREFERENCE = "USD"
const DEFAULT_LENGTH_UNIT_PREFERENCE = "in"

export const CurrencyPreference = new GraphQLEnumType({
  name: "CurrencyPreference",
  values: {
    EUR: {
      value: "EUR",
    },
    USD: {
      value: "USD",
    },
    GBP: {
      value: "GBP",
    },
  },
})

export const LengthUnitPreference = new GraphQLEnumType({
  name: "LengthUnitPreference",
  values: {
    CM: {
      value: "cm",
    },
    IN: {
      value: "in",
    },
  },
})

export const meType = new GraphQLObjectType<any, ResolverContext>({
  name: "Me",
  interfaces: [NodeInterface],
  fields: {
    ...IDFields,
    artistRecommendations: ArtistRecommendations,
    artworkRecommendations: ArtworkRecommendations,
    artworkInquiriesConnection: ArtworkInquiries,
    auctionResultsByFollowedArtists: AuctionResultsByFollowedArtists,
    authentications: authentications,
    bankAccounts: BankAccounts,
    bidders: Bidders,
    bidderStatus: BidderStatus,
    bidderPositions: BidderPositions,
    bidderPosition: BidderPosition,
    bio: {
      type: GraphQLString,
      resolve: collectorProfileResolver("bio"),
    },
    collectorLevel: {
      type: GraphQLInt,
      resolve: ({ collector_level }) => {
        return collector_level
      },
    },
    collectorProfile: CollectorProfile,
    emailConfirmed: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "User has confirmed their email address",
      resolve: ({ confirmed_at }) => {
        if (confirmed_at) {
          return true
        }
        return false
      },
    },
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
    currencyPreference: {
      type: new GraphQLNonNull(CurrencyPreference),
      description: "Currency preference of the user",
      resolve: ({ currency_preference }) =>
        currency_preference || DEFAULT_CURRENCY_PREFERENCE,
    },
    lengthUnitPreference: {
      type: new GraphQLNonNull(LengthUnitPreference),
      description: "Length unit preference of the user",
      resolve: ({ length_unit_preference }) =>
        length_unit_preference || DEFAULT_LENGTH_UNIT_PREFERENCE,
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
          profilesConnection: followedProfiles,
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
    icon: {
      type: Image.type,
      resolve: collectorProfileResolver("icon"),
    },
    invoice: Invoice,
    identityVerification: IdentityVerification,
    identityVerified: {
      type: GraphQLBoolean,
      resolve: ({ identity_verified }) => identity_verified,
    },
    inquiryIntroduction: {
      type: GraphQLString,
      resolve: async (_me, _options, { inquiryIntroductionLoader }) => {
        const { introduction } = await inquiryIntroductionLoader?.()
        return introduction
      },
    },
    isCollector: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: ({ is_collector }) => {
        return !!is_collector
      },
    },
    labFeatures: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString))),
      description: "List of lab features for this user",
      resolve: ({ lab_features }) => lab_features || [],
    },
    location: { type: myLocationType },
    lotsByFollowedArtistsConnection: SaleArtworksConnectionField,
    lotStanding: LotStanding,
    lotStandings: LotStandings,
    partners: ManagedPartners,
    myCollectionConnection: MyCollection,
    myCollectionInfo: MyCollectionInfo,
    myCollectionAuctionResults: MyCollectionAuctionResults,
    myBids: MyBids,
    name: {
      type: GraphQLString,
    },
    newWorksByInterestingArtists: NewWorksByInterestingArtists,
    initials: initials("name"),
    paddleNumber: {
      type: GraphQLString,
      resolve: ({ paddle_number }) => paddle_number,
    },
    pendingIdentityVerification: PendingIdentityVerification,
    phone: {
      type: GraphQLString,
    },
    phoneNumber: {
      type: PhoneNumber.type,
      resolve: ({ phone }, _, context, info) =>
        PhoneNumber.resolve?.(null, { phoneNumber: phone }, context, info),
    },
    priceRange: {
      type: GraphQLString,
      resolve: ({ price_range }) => price_range,
    },
    priceRangeMin: {
      type: GraphQLFloat,
      resolve: ({ price_range }) => price_range?.split(":")[0],
    },
    priceRangeMax: {
      type: GraphQLFloat,
      resolve: ({ price_range }) => price_range?.split(":")[1],
    },
    privacy: { type: GraphQLString },
    profession: {
      type: GraphQLString,
    },
    otherRelevantPosition: {
      type: GraphQLString,
      description: "Collector's position with relevant institutions",
      deprecationReason: "Use `otherRelevantPositions` instead",
    },
    otherRelevantPositions: {
      type: GraphQLString,
      description: "Collector's position with relevant institutions",
      resolve: collectorProfileResolver("other_relevant_positions"),
    },
    quiz,
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
    receiveOrderNotification: {
      description: "This user should receive order notifications",
      type: GraphQLBoolean,
      resolve: ({ receive_order_notification }) => receive_order_notification,
    },
    receiveViewingRoomNotification: {
      description: "This user should receive viewing room notifications",
      type: GraphQLBoolean,
      resolve: ({ receive_viewing_room_notification }) =>
        receive_viewing_room_notification,
    },
    receivePartnerShowNotification: {
      description: "This user should receive partner show notifications",
      type: GraphQLBoolean,
      resolve: ({ receive_partner_show_notification }) =>
        receive_partner_show_notification,
    },
    recentlyViewedArtworkIds: {
      type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
      resolve: ({ recently_viewed_artwork_ids }) => recently_viewed_artwork_ids,
    },
    recentlyViewedArtworksConnection: RecentlyViewedArtworks,
    saleRegistrationsConnection: SaleRegistrationConnection,
    shareFollows: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: ({ share_follows }) => {
        return !!share_follows
      },
    },
    type: {
      type: GraphQLString,
    },
    showsByFollowedArtists: ShowsByFollowedArtists,
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
      resolve: (_root, _options, { conversationsLoader, userID }) => {
        if (!conversationsLoader) return 0
        const expand = ["total_unread_count"]
        return conversationsLoader({
          page: 1,
          size: 0,
          expand,
          from_id: userID,
          from_type: "User",
          has_message: true,
        }).then(({ total_unread_count }) => total_unread_count)
      },
    },
    watchedLotConnection: WatchedLotConnection,
  },
})

const MeField: GraphQLFieldConfig<void, ResolverContext> = {
  type: meType,
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
