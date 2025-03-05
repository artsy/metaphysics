import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLError,
  GraphQLFieldConfig,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { includesFieldsOtherThanSelectionSet } from "lib/hasFieldSelection"
import {
  DEFAULT_CURRENCY_PREFERENCE,
  DEFAULT_LENGTH_UNIT_PREFERENCE,
  convertConnectionArgsToGravityArgs,
  snakeCaseKeys,
} from "lib/helpers"
import { StaticPathLoader } from "lib/loaders/api/loader_interface"
import moment from "moment"
import { pageable } from "relay-cursor-paging"
import Conversation from "schema/v2/conversation"
import Conversations from "schema/v2/conversation/conversations"
import date from "schema/v2/fields/date"
import initials from "schema/v2/fields/initials"
import { createPageCursors } from "schema/v2/fields/pagination"
import { IDFields, NodeInterface } from "schema/v2/object_identification"
import { ResolverContext } from "types/graphql"
import {
  AlertType,
  AlertsConnectionSortEnum,
  AlertsConnectionType,
  resolveAlertFromJSON,
} from "../Alerts"
import { MeCollectorProfile } from "../CollectorProfile/collectorProfile"
import { artworkConnection } from "../artwork"
import { emptyConnection, paginationResolver } from "../fields/pagination"
import {
  IdentityVerification,
  PendingIdentityVerification,
} from "../identityVerification"
import Image from "../image"
import { NotificationType } from "../notifications"
import {
  PartnerOfferToCollectorConnectionType,
  PartnerOfferToCollectorSortsType,
} from "../partnerOfferToCollector"
import { PhoneNumber } from "../phoneNumber"
import { PreviewSavedSearchAttributesType } from "../previewSavedSearch"
import { quiz } from "../quiz"
import { SaleArtworksConnectionField } from "../sale_artworks"
import { ArtistRecommendations } from "./artistRecommendations"
import { ArtworkRecommendations } from "./artworkRecommendations"
import ArtworkInquiries from "./artwork_inquiries"
import AuctionResultsByFollowedArtists from "./auctionResultsByFollowedArtists"
import { authentications } from "./authentications"
import { BankAccounts } from "./bank_accounts"
import { BidderPosition } from "./bidder_position"
import BidderPositions from "./bidder_positions"
import BidderStatus from "./bidder_status"
import Bidders from "./bidders"
import { Collection } from "./collection"
import { CollectionsConnection } from "./collectionsConnection"
import { CreditCards } from "./credit_cards"
import { followedProfiles } from "./followedProfiles"
import FollowedArtists from "./followed_artists"
import FollowedArtistsArtworkGroups from "./followed_artists_artworks_group"
import FollowedFairs from "./followed_fairs"
import FollowedGalleries from "./followed_galleries"
import FollowedGenes from "./followed_genes"
import FollowedShows from "./followed_shows"
import LotStanding from "./lot_standing"
import LotStandings from "./lot_standings"
import { MyBids } from "./myBids"
import { MyCollection } from "./myCollection"
import MyCollectionAuctionResults from "./myCollectionAuctionResults"
import { MyCollectionInfo } from "./myCollectionInfo"
import { myLocationType } from "./myLocation"
import { NewWorksByInterestingArtists } from "./newWorksByInterestingArtists"
import { newWorksFromGalleriesYouFollow } from "./newWorksFromGalleriesYouFollow"
import { ManagedPartners } from "./partners"
import { RecentlyViewedArtworks } from "./recentlyViewedArtworks"
import { SaleRegistrationConnection } from "./sale_registrations"
import { SavedArtworks } from "./savedArtworks"
import { ShowsByFollowedArtists } from "./showsByFollowedArtists"
import { ShowsConnection } from "./showsConnection"
import { SimilarToRecentlyViewed } from "./similarToRecentlyViewed"
import { submissionsConnection } from "./submissionsConnection"
import { TaskType } from "./task"
import { UserInterest } from "./userInterest"
import { UserInterestsConnection } from "./userInterestsConnection"
import { WatchedLotConnection } from "./watchedLotConnection"
import {
  SecondFactorInterface,
  SecondFactorKind,
} from "./secondFactors/secondFactors"
import { Order } from "../order"

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
  fields: () => ({
    ...IDFields,
    alert: {
      type: AlertType,
      args: {
        id: {
          type: new GraphQLNonNull(GraphQLString),
        },
      },
      resolve: async (_parent, { id: alertID }, { meAlertLoader }) => {
        if (!meAlertLoader) return null
        const alert = await meAlertLoader(alertID)

        return resolveAlertFromJSON(alert)
      },
    },
    alertsConnection: {
      args: pageable({
        sort: {
          type: AlertsConnectionSortEnum,
        },
        attributes: {
          type: PreviewSavedSearchAttributesType,
        },
      }),
      type: new GraphQLNonNull(AlertsConnectionType),
      resolve: async (_parent, args, { meAlertsLoader }) => {
        if (!meAlertsLoader) return emptyConnection
        const { page, size, offset, sort } = convertConnectionArgsToGravityArgs(
          args
        )

        // Convert artistIDs to artist_ids, etc.
        const gravitySearchCriteriaAttributes = snakeCaseKeys(
          args.attributes
        ) as any

        const { body, headers } = await meAlertsLoader({
          page,
          size,
          sort,
          total_count: true,
          search_criteria: gravitySearchCriteriaAttributes,
        })
        const totalCount = parseInt(headers["x-total-count"] || "0", 10)

        return paginationResolver({
          args,
          body,
          offset,
          page,
          size,
          totalCount,
          resolveNode: resolveAlertFromJSON,
        })
      },
    },
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
    collection: Collection,
    collectionsConnection: CollectionsConnection,
    collectorLevel: {
      type: GraphQLInt,
      resolve: ({ collector_level }) => {
        return collector_level
      },
    },
    collectorProfile: MeCollectorProfile,
    emailConfirmed: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "User has confirmed their email address",
      deprecationReason:
        "emailConfirmed is going to be removed, use isEmailConfirmed instead",
      resolve: ({ confirmed_at }) => !!confirmed_at,
    },
    isEmailConfirmed: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "User has confirmed their email address",
      resolve: ({ confirmed_at }) => !!confirmed_at,
    },
    conversation: Conversation,
    conversationsConnection: Conversations,
    counts: {
      type: new GraphQLObjectType<any, ResolverContext>({
        name: "MeCounts",
        fields: {
          followedArtists: {
            type: new GraphQLNonNull(GraphQLInt),
            resolve: async (_me, _args, { followedArtistsLoader }) => {
              if (!followedArtistsLoader) return 0

              try {
                const { headers } = await followedArtistsLoader({
                  page: 1,
                  size: 1,
                  total_count: true,
                })

                return headers["x-total-count"] ?? 0
              } catch (error) {
                console.error(error)
                return 0
              }
            },
          },
          followedProfiles: {
            type: new GraphQLNonNull(GraphQLInt),
            description:
              "Returns the total count of followed profiles. There is currently no way to filter this count by `owner_type`.",
            resolve: async (_me, _args, { followedPartnersLoader }) => {
              if (!followedPartnersLoader) return 0

              try {
                const { headers } = await followedPartnersLoader({
                  page: 1,
                  size: 1,
                  total_count: true,
                })

                return headers["x-total-count"] ?? 0
              } catch (error) {
                console.error(error)
                return 0
              }
            },
          },
          savedArtworks: {
            type: new GraphQLNonNull(GraphQLInt),
            resolve: async (_me, _args, { meCollectorProfileLoader }) => {
              if (!meCollectorProfileLoader) return 0

              try {
                const {
                  saved_artworks_count,
                } = await meCollectorProfileLoader()
                return saved_artworks_count
              } catch (error) {
                console.error(error)
                return 0
              }
            },
          },
          savedSearches: {
            type: new GraphQLNonNull(GraphQLInt),
            resolve: async (_me, _args, { meAlertsLoader }) => {
              if (!meAlertsLoader) return 0

              try {
                const { headers } = await meAlertsLoader({
                  size: 0,
                  total_count: true,
                })
                const totalCount = parseInt(headers["x-total-count"] || "0", 10)

                return totalCount
              } catch (error) {
                console.error(error)
                return 0
              }
            },
          },
        },
      }),
      resolve: (me) => me,
    },
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
          ({ body: cards = [] }) => {
            const unexpiredCards = cards.filter((card) => {
              const {
                expiration_month: expMonth,
                expiration_year: expYear,
              } = card

              // Moment months are 0-indexed
              const expirationMoment = moment
                .utc({ year: expYear, month: expMonth - 1 })
                .endOf("month")

              return expirationMoment.isAfter(moment.utc())
            })
            return unexpiredCards.length > 0
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
    identityVerification: IdentityVerification,
    identityVerified: {
      type: GraphQLBoolean,
      deprecationReason:
        "identityVerified is going to be removed, use isIdentityVerified instead",
      resolve: ({ identity_verified }) => identity_verified,
    },
    isIdentityVerified: {
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
    userInterestsConnection: UserInterestsConnection,
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
    notification: {
      type: NotificationType,
      description: "Retrieve one user's notification by notification ID",
      args: {
        id: {
          type: new GraphQLNonNull(GraphQLString),
          description: "The ID of the Notification",
        },
      },
      resolve: (_root, { id }, { meNotificationLoader }) => {
        if (!meNotificationLoader)
          throw new Error("You need to be signed in to perform this action")

        return meNotificationLoader(id)
      },
    },
    initials: initials("name"),
    order: Order,
    paddleNumber: {
      type: GraphQLString,
      resolve: ({ paddle_number }) => paddle_number,
    },
    partnerOffersConnection: {
      type: PartnerOfferToCollectorConnectionType,
      args: pageable({
        artworkID: {
          type: GraphQLString,
        },
        page: { type: GraphQLInt },
        size: { type: GraphQLInt },
        sort: { type: PartnerOfferToCollectorSortsType },
      }),
      resolve: async (_me, args, { mePartnerOffersLoader }) => {
        if (!mePartnerOffersLoader)
          throw new Error("You need to be signed in to perform this action")

        const paginationArgs = convertConnectionArgsToGravityArgs(args)
        const { page, size, offset } = paginationArgs

        const gravityArgs = {
          total_count: true,
          page,
          size,
        }

        if (args.sort) {
          gravityArgs["sort"] = args.sort
        }
        if (args.artworkID) {
          gravityArgs["artwork_id"] = args.artworkID
        }

        const { body, headers } = await mePartnerOffersLoader(gravityArgs)

        const totalCount = parseInt(headers["x-total-count"] || "0", 10)

        return paginationResolver({
          args,
          body,
          offset,
          page,
          size,
          totalCount,
        })
      },
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
    receivePartnerOfferNotification: {
      description: "This user should receive partner offer notifications",
      type: GraphQLBoolean,
      resolve: ({ receive_partner_offer_notification }) =>
        receive_partner_offer_notification,
    },
    recentlyViewedArtworkIds: {
      type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
      resolve: ({ recently_viewed_artwork_ids }) => recently_viewed_artwork_ids,
    },
    recentlyViewedArtworksConnection: RecentlyViewedArtworks,
    newWorksFromGalleriesYouFollowConnection: newWorksFromGalleriesYouFollow,
    saleRegistrationsConnection: SaleRegistrationConnection,
    secondFactors: {
      type: new GraphQLList(SecondFactorInterface),
      args: {
        kinds: {
          type: new GraphQLList(SecondFactorKind),
        },
      },
      resolve: (_root, { kinds }, { secondFactorsLoader }) => {
        if (!secondFactorsLoader) return []
        return secondFactorsLoader({ kinds })
      },
    },
    shareFollows: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: ({ share_follows }) => {
        return !!share_follows
      },
    },
    submissionsConnection: submissionsConnection,
    recommendedArtworks: {
      deprecationReason:
        "These genomic recs are deprecated. Use artworkRecommendations instead.",
      type: artworkConnection.connectionType,
      args: pageable({
        page: { type: GraphQLInt },
      }),
      resolve: async (_root, args, { homepageSuggestedArtworksLoader }) => {
        if (!homepageSuggestedArtworksLoader) return null

        try {
          const { page, size, offset } = convertConnectionArgsToGravityArgs(
            args
          )

          const recommendedArtworks = await homepageSuggestedArtworksLoader({
            limit: size,
          })

          const totalCount = recommendedArtworks.length

          const connection = connectionFromArraySlice(
            recommendedArtworks,
            args,
            {
              arrayLength: totalCount,
              sliceStart: offset,
            }
          )

          const totalPages = Math.ceil(totalCount / size)

          return {
            totalCount,
            pageCursors: createPageCursors({ ...args, page, size }, totalCount),
            ...connection,
            pageInfo: {
              ...connection.pageInfo,
              hasPreviousPage: page > 1,
              hasNextPage: page < totalPages,
            },
          }
        } catch (e) {
          console.error(e)
          throw new GraphQLError(
            "[metaphysics @ gravity/v2/me] Error fetching recommended artworks"
          )
        }
      },
    },
    similarToRecentlyViewedConnection: SimilarToRecentlyViewed,
    tasks: {
      type: new GraphQLList(TaskType),
      args: {
        limit: { type: GraphQLInt },
      },
      resolve: (_root, { limit }, { meTasksLoader }) => {
        if (!meTasksLoader) return null
        return meTasksLoader({ size: limit })
      },
    },
    type: {
      type: GraphQLString,
    },
    showsByFollowedArtists: ShowsByFollowedArtists,
    showsConnection: ShowsConnection,
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
    unseenNotificationsCount: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "A count of unseen notifications.",
      resolve: (_root, options, { notificationsFeedLoader }) => {
        if (!notificationsFeedLoader)
          throw new Error("You need to be signed in to perform this action")

        return notificationsFeedLoader(options).then(({ total_unseen }) => {
          return total_unseen || 0
        })
      },
    },
    userInterest: UserInterest,
    watchedLotConnection: WatchedLotConnection,
  }),
})

const MeField: GraphQLFieldConfig<void, ResolverContext> = {
  type: meType,
  resolve: (
    _root,
    _options,
    { userID, meLoader, xImpersonateUserID },
    info
  ) => {
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
      "unseenNotificationsCount",
      "showsByFollowedArtists",
      "newWorksFromGalleriesYouFollowConnection",
      "myCollectionInfo",
      "watchedLotConnection",
      "userInterestsConnection",
      "myCollectionConnection",
      "artworkInquiriesConnection",
      "collectionsConnection",
      "auctionResultsByFollowedArtists",
      "myCollectionAuctionResults",
      "newWorksByInterestingArtists",
      "artistRecommendations",
      "artworkRecommendations",
    ]

    if (xImpersonateUserID) {
      return {}
    }

    if (includesFieldsOtherThanSelectionSet(info, fieldsNotRequireLoader)) {
      return meLoader()
    }
    // The email and is_collector are here so that the type system's `isTypeOf`
    // resolves correctly when we're skipping gravity data
    return { id: userID, email: null, is_collector: null }
  },
}

export default MeField
