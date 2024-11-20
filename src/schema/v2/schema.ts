import { GraphQLObjectType, GraphQLSchema, specifiedDirectives } from "graphql"
import { ArtworkOrEditionSetType } from "schema/v2/artworkOrEditionSet"
import { ResolverContext } from "types/graphql"
// import Status from "./status"
import Article from "./article"
import Articles from "./articles"
import ArticlesConnection from "./articlesConnection"
import Artist from "./artist"
import Artists, { artistsConnection } from "./artists"
import { CuratedTrendingArtists } from "./artists/curatedTrending"
import { mergeArtistsMutation } from "./artists/mergeArtistsMutation"
import Artwork from "./artwork"
import { ArtistArtworkGridType } from "./artwork/artworkContextGrids/ArtistArtworkGrid"
import { AuctionArtworkGridType } from "./artwork/artworkContextGrids/AuctionArtworkGrid"
import { PartnerArtworkGridType } from "./artwork/artworkContextGrids/PartnerArtworkGrid"
import { RelatedArtworkGridType } from "./artwork/artworkContextGrids/RelatedArtworkGrid"
import { ShowArtworkGridType } from "./artwork/artworkContextGrids/ShowArtworkGrid"
import { ArtworkVersionType } from "./artwork_version"
import ArtworkAttributionClasses from "./artworkAttributionClasses"
import ArtworkMediums from "./artworkMediums"
import Artworks from "./artworks"
import CreateAssetRequestLoader from "./asset_uploads/create_asset_request_mutation"
import CreateGeminiEntryForAsset from "./asset_uploads/finalize_asset_mutation"
import { AuctionResult } from "./auction_result"
import { cities } from "./cities"
import { City } from "./city"
import { createAccountRequestMutation } from "./createAccountRequestMutation"
import { createVerifiedRepresentativeMutation } from "./verifiedRepresentative/createVerifiedRepresentativeMutation"
import { deleteVerifiedRepresentativeMutation } from "./verifiedRepresentative/deleteVerifiedRepresentativeMutation"
import { createHeroUnitMutation } from "./HeroUnit/createHeroUnitMutation"
import { deleteHeroUnitMutation } from "./HeroUnit/deleteHeroUnitMutation"
import { heroUnit } from "./HeroUnit/heroUnit"
import { heroUnitsConnection } from "./HeroUnit/heroUnitsConnection"
import { updateHeroUnitMutation } from "./HeroUnit/updateHeroUnitMutation"
import { artworksCollectionsBatchUpdateMutation } from "./me/artworksCollectionsBatchUpdateMutation"
import { createCollectionMutation } from "./me/createCollectionMutation"
import { deleteCollectionMutation } from "./me/deleteCollectionMutation"
import {
  notificationPreferences,
  updateNotificationPreferencesMutation,
} from "./notification_preferences"
// import Collection from "./collection"
import { CreditCard } from "./credit_card"
import { DeleteArtworkImageMutation } from "./deleteArtworkImageMutation"
import { OrderPartyUnionType } from "./ecommerce/types/order_party_union"
import Fair from "./fair"
import Fairs, { fairsConnection } from "./fairs"
import { Feature } from "./Feature"
import FilterPartners from "./filter_partners"
import { filterArtworksConnection } from "./filterArtworksConnection"
import Gene from "./gene"
// import ExternalPartner from "./external_partner"
// import Fairs from "./fairs"
import GeneFamilies from "./gene_families"
import Genes from "./genes"
import { HighlightsField } from "./Highlights"
import HomePage from "./home"
import { HomeView } from "./homeView"
import Image from "./image"
import Me from "./me"
import { BidderPositionMutation } from "./me/bidder_position_mutation"
// import MatchGene from "./match/gene"
// import SaleArtwork from "./sale_artwork"
import MatchArtist from "./match/artist"
// import { SaleArtworksConnectionField } from "./sale_artworks"
import Partner from "schema/v2/partner/partner"
import Conversation from ".//conversation"
import { updateArtistMutation } from "./artist/updateArtistMutation"
import UpdateCollectorProfileWithID from "./CollectorProfile/mutations/updateCollectorProfileWithID"
import SendConversationMessageMutation from "./conversation/send_message_mutation"
import { submitInquiryRequestMutation } from "./conversation/submit_inquiry_request_mutation"
import UpdateConversationMutation from "./conversation/update_conversation_mutation"
import createBidderMutation from "./me/create_bidder_mutation"
import createCreditCardMutation from "./me/create_credit_card_mutation"
import { deleteBankAccountMutation } from "./me/delete_bank_account_mutation"
import { deleteCreditCardMutation } from "./me/delete_credit_card_mutation"
import { deleteCollectorProfileIconMutation } from "./me/deleteCollectorProfileIconMutation"
import dislikeArtworkMutation from "./me/dislikeArtworkMutation"
import { dismissTaskMutation } from "./me/dismiss_task_mutation"
import FollowArtist from "./me/follow_artist"
import FollowGene from "./me/follow_gene"
import FollowProfile from "./me/follow_profile"
import FollowShow from "./me/follow_show"
import { myCollectionCreateArtworkMutation } from "./me/myCollectionCreateArtworkMutation"
import { myCollectionDeleteArtworkMutation } from "./me/myCollectionDeleteArtworkMutation"
import { myCollectionUpdateArtworkMutation } from "./me/myCollectionUpdateArtworkMutation"
import saveArtworkMutation from "./me/saveArtworkMutation"
import { sendConfirmationEmailMutation } from "./me/sendConfirmationEmailMutation"
import UpdateCollectorProfile from "./me/update_collector_profile"
import UpdateMyUserProfileMutation from "./me/update_me_mutation"
import { updateCollectionMutation } from "./me/updateCollectionMutation"
import { updateMyPasswordMutation } from "./me/updateMyPasswordMutation"
import ObjectIdentification from "./object_identification"
import { OrderedSet } from "./OrderedSet"
import { addOrderedSetItemMutation } from "./OrderedSet/addOrderedSetItemMutation"
import { createOrderedSetMutation } from "./OrderedSet/createOrderedSetMutation"
import { deleteOrderedSetItemMutation } from "./OrderedSet/deleteOrderedSetItemMutation"
import { deleteOrderedSetMutation } from "./OrderedSet/deleteOrderedSetMutation"
import OrderedSets from "./OrderedSet/orderedSets"
import { updateOrderedSetMutation } from "./OrderedSet/updateOrderedSetMutation"
import PartnerArtworks from "./partner/partnerArtworks"
import Profile from "./profile"
import { addUserRoleMutation } from "./users/addUserRoleMutation"
import { createUserAdminNoteMutation } from "./users/createUserAdminNoteMutation"
import { deleteUserAdminNoteMutation } from "./users/deleteUserAdminNoteMutation"
import deleteUserMutation from "./users/deleteUserMutation"
import { deleteUserRoleMutation } from "./users/deleteUserRoleMutation"
import { updateUserMutation } from "./users/updateUserMutation"
import { updateUserSaleProfileMutation } from "./users/updateUserSaleProfileMutation"
// import Partner from "schema/v2/partner/partner"
import PartnerCategories from "./partner/partner_categories"
import PartnerCategory from "./partner/partner_category"
import { PartnersConnection } from "./partner/partners"
import { RequestLocationField } from "./requestLocation"
import { endSaleMutation } from "./sale/end_sale_mutation"
import Sale from "./sale/index"
import SaleArtwork from "./sale_artwork"
import { SaleArtworksConnectionField } from "./sale_artworks"
import { SalesConnectionField } from "./sales"
import { Search } from "./search"
import { SearchableItem } from "./SearchableItem"
import { sendFeedbackMutation } from "./sendFeedbackMutation"
import Show from "./show"
import { Shows } from "./shows"
import { startIdentityVerificationMutation } from "./startIdentityVerificationMutation"
import StaticContent from "./static_content"
import System from "./system"
// import SuggestedGenes from "./suggested_genes"
import { TagField } from "./tag"
import { TargetSupply } from "./TargetSupply"
import { UserField } from "./user"
// import TrendingArtists from "./artists/trending"
import { updateQuizMutation } from "schema/v2/updateQuizMutation"
import { AdminField } from "./featureFlags/admin"
import { createFeatureFlagMutation } from "./featureFlags/admin/mutations/createFeatureFlagMutation"
import { deleteFeatureFlagMutation } from "./featureFlags/admin/mutations/deleteFeatureFlagMutation"
import { toggleFeatureFlagMutation } from "./featureFlags/admin/mutations/toggleFeatureFlagMutation"
import { updateFeatureFlagMutation } from "./featureFlags/admin/mutations/updateFeatureFlagMutation"
import { channel } from "./article/channel"
import { createArtistMutation } from "./artist/createArtistMutation"
import { deleteArtistMutation } from "./artist/deleteArtistMutation"
import { updateArtworkMutation } from "./artwork/updateArtworkMutation"
import { artworksForUser } from "./artworksForUser"
import { authenticationStatus } from "./authenticationStatus"
import { BankAccount } from "./bank_account"
import { bulkUpdatePartnerArtworksMutation } from "./bulkUpdatePartnerArtworksMutation"
import { CollectorProfileForUser } from "./CollectorProfile/collectorProfile"
import { CollectorProfilesConnection } from "./CollectorProfile/collectorProfiles"
import { createConsignmentInquiryMutation } from "./consignments/createConsignmentInquiryMutation"
import Conversations from "./conversation/conversations"
import deleteConversationMutation from "./conversation/deleteConversationMutation"
import updateMessageMutation from "./conversation/updateMessageMutation"
import { createIdentityVerificationOverrideMutation } from "./createIdentityVerificationOverrideMutation"
import { externalField } from "./External/External"
import FairOrganizer from "./fair_organizer"
import { CreateFeatureMutation } from "./Feature/CreateFeatureMutation"
import { DeleteFeatureMutation } from "./Feature/DeleteFeatureMutation"
import { FeaturesConnection } from "./Feature/FeaturesConnection"
import { UpdateFeatureMutation } from "./Feature/UpdateFeatureMutation"
import { CreateFeaturedLinkMutation } from "./FeaturedLink/createFeaturedLinkMutation"
import { DeleteFeaturedLinkMutation } from "./FeaturedLink/deleteFeaturedLinkMutation"
import { FeaturedLinksConnection } from "./FeaturedLink/featuredLinksConnection"
import { UpdateFeaturedLinkMutation } from "./FeaturedLink/updateFeaturedLinkMutation"
import {
  IdentityVerification,
  identityVerificationsConnection,
} from "./identityVerification"
import { departments, job, jobs } from "./jobs"
import { MarkdownContent } from "./markdownContent"
import { MatchConnection } from "./Match"
import { createUserInterestMutation } from "./me/createUserInterestMutation"
import { createUserInterestsMutation } from "./me/createUserInterestsMutation"
import { deleteUserAccountMutation } from "./me/delete_account_mutation"
import { deleteUserInterestMutation } from "./me/deleteUserInterestMutation"
import { deleteUserInterestsMutation } from "./me/deleteUserInterestsMutation"
import { linkAuthenticationMutation } from "./me/linkAuthenticationMutation"
import { markAllNotificationsAsReadMutation } from "./me/mark_all_notifications_as_read_mutation"
import { markNotificationAsReadMutation } from "./me/mark_notification_as_read_mutation"
import { markNotificationsAsSeenMutation } from "./me/markNotificationsAsSeenMutation"
import { requestPriceEstimateMutation } from "./me/requestPriceEstimate"
import { sendIdentityVerificationEmailMutation } from "./me/sendIdentityVerficationEmailMutation"
import { triggerCampaignMutation } from "./me/triggerCampaignMutation"
import { unlinkAuthenticationMutation } from "./me/unlinkAuthenticationMutation"
import { NotificationsConnection } from "./notifications"
import { OrderedSetsConnection } from "./OrderedSet/orderedSetsConnection"
import { CreatePageMutation } from "./Page/CreatePageMutation"
import { DeletePageMutation } from "./Page/DeletePageMutation"
import { Page } from "./Page/Page"
import { PagesConnection } from "./Page/PagesConnection"
import { UpdatePageMutation } from "./Page/UpdatePageMutation"
import { PartnerArtistDocumentsConnection } from "./partner/partnerArtistDocumentsConnection"
import { PartnerShowDocumentsConnection } from "./partner/partnerShowDocumentsConnection"
import { updateCMSLastAccessTimestampMutation } from "./partner/updateCMSLastAccessTimestampMutation"
import { PaymentMethodUnion, WireTransferType } from "./payment_method_union"
import { PhoneNumber } from "./phoneNumber"
import { PreviewSavedSearchField } from "./previewSavedSearch"
import { Profiles } from "./profiles"
import { RecentlySoldArtworks } from "./recentlySoldArtworks"
import { SearchCriteriaLabel } from "./previewSavedSearch/searchCriteriaLabel"
import { shortcut } from "./shortcut"
import { Users } from "./users"
import { createUserInterestForUser } from "./users/createUserInterestForUserMutation"
import { createUserSaleProfileMutation } from "./users/createUserSaleProfileMutation"
import { deleteUserInterestForUser } from "./users/deleteUserInterestForUserMutation"
import VanityURLEntity from "./vanityURLEntity"
import { VerifyAddress } from "./verifyAddress"
import { updateUserInterestMutation } from "./me/updateUserInterestMutation"
import { updateUserInterestsMutation } from "./me/updateUserInterestsMutation"
import { createPartnerOfferMutation } from "./createPartnerOfferMutation"
import { createAlertMutation } from "./Alerts/createAlertMutation"
import { updateAlertMutation } from "./Alerts/updateAlertMutation"
import { deleteAlertMutation } from "./Alerts/deleteAlertMutation"
import { ArtworkResult } from "./artworkResult"
import { updateMeCollectionsMutation } from "./me/updateCollectionsMutation"
import { CreateSaleAgreementMutation } from "./SaleAgreements/createSaleAgreementMutation"
import { UpdateSaleAgreementMutation } from "./SaleAgreements/updateSaleAgreementMutation"
import { SaleAgreementsConnection } from "./SaleAgreements/saleAgreementsConnection"
import { SaleAgreement } from "./SaleAgreements/SaleAgreement"
import {
  MarketingCollection,
  MarketingCollections,
  CuratedMarketingCollections,
} from "./marketingCollections"
import { MarketingCategories } from "./marketingCategories"
import { createCareerHighlightMutation } from "./careerHighlight/createCareerHighlightMutation"
import { deleteCareerHighlightMutation } from "./careerHighlight/deleteCareerHighlightMutation"
import { updateCareerHighlightMutation } from "./careerHighlight/updateCareerHighlightMutation"
import { updatePartnerShowMutation } from "./partner/updatePartnerShowMutation"
import { VerifyUser } from "./verifyUser"
import { ArtistSeries, ArtistSeriesConnection } from "./artistSeries"
import { homeViewSectionTypes } from "./homeView/sectionTypes"
import { CacheableDirective } from "directives/cacheableDirective"
import { OptionalFieldDirective } from "directives/optionalField/optionalFieldsDirectiveExtension"
import { PrincipalFieldDirective } from "directives/principalField/principalFieldDirectiveExtension"
import { commerceOptInMutation } from "./partner/CommerceOptIn/commerceOptInMutation"
import { commerceOptInReportMutation } from "./partner/CommerceOptIn/commerceOptInReportMutation"
import config from "config"
import { ViewingRoom } from "./viewingRoom"
import { ViewingRoomsConnection } from "./viewingRoomConnection"
import { Invoice } from "./Invoice/invoice"
import { createInvoicePaymentMutation } from "./Invoice/createInvoicePaymentMutation"
import { ackTaskMutation } from "./me/ack_task_mutation"
import { DiscoverArtworks } from "./infiniteDiscovery/discoverArtworks"
import { CreateDiscoveryLikedArtworkMutation } from "./infiniteDiscovery/createDiscoveryArtworkReferenceMutation"
import { CreateDiscoveryUserMutation } from "./infiniteDiscovery/createDiscoveryUserMutation"
import { DeleteDiscoveryUserReferencesMutation } from "./infiniteDiscovery/resetDiscoveryArtworkReferencesMutation"
import { LikedDiscoveryArtworks } from "./infiniteDiscovery/likedDiscoveryArtworks"
import {
  BackupSecondFactor,
  AppSecondFactor,
  SmsSecondFactor,
  BackupSecondFactors,
} from "./me/secondFactors/secondFactors"
import { createSmsSecondFactorMutation } from "./me/secondFactors/mutations/createSmsSecondFactor"
import { updateSmsSecondFactorMutation } from "./me/secondFactors/mutations/updateSmsSecondFactor"
import { createAppSecondFactorMutation } from "./me/secondFactors/mutations/createAppSecondFactor"
import { updateAppSecondFactorMutation } from "./me/secondFactors/mutations/updateAppSecondFactor"
import { createBackupSecondFactorsMutation } from "./me/secondFactors/mutations/createBackupSecondFactors"
import { disableSecondFactorMutation } from "./me/secondFactors/mutations/disableSecondFactor"
import { deliverSecondFactorMutation } from "./me/secondFactors/mutations/deliverSecondFactor"
import { enableSecondFactorMutation } from "./me/secondFactors/mutations/enableSecondFactor"
import { createAndSendBackupSecondFactorMutation } from "./users/createAndSendBackupSecondFactorMutation"

const viewingRoomUnstitchedRootField = config.USE_UNSTITCHED_VIEWING_ROOM_SCHEMA
  ? {
      viewingRoom: ViewingRoom,
      viewingRoomsConnection: ViewingRoomsConnection,
    }
  : ({} as any)

const rootFields = {
  // artworkVersion: ArtworkVersionResolver,
  // externalPartner: ExternalPartner,
  // filterArtworksConnection: filterArtworksConnection(),
  // matchGene: MatchGene,
  // popularArtists: PopularArtists,
  // status: Status,
  // suggestedGenes: SuggestedGenes,
  // trendingArtists: TrendingArtists,
  _do_not_use_conversation: {
    ...Conversation,
    description: "Do not use (only used internally for stitching)",
  },
  _do_not_use_image: {
    type: Image.type,
    resolve: Image.resolve,
    description: "Do not use (only used internally for stitching)",
  },
  admin: AdminField,
  article: Article,
  articles: Articles,
  articlesConnection: ArticlesConnection,
  artist: Artist,
  artists: Artists,
  artistsConnection,
  artistSeries: ArtistSeries,
  artistSeriesConnection: ArtistSeriesConnection,
  artwork: Artwork,
  artworkAttributionClasses: ArtworkAttributionClasses,
  artworkMediums: ArtworkMediums,
  artworkResult: ArtworkResult,
  artworks: Artworks,
  artworksConnection: filterArtworksConnection(),
  artworksForUser,
  auctionResult: AuctionResult,
  authenticationStatus,
  bankAccount: BankAccount,
  channel,
  cities,
  city: City,
  collectorProfile: CollectorProfileForUser,
  collectorProfilesConnection: CollectorProfilesConnection,
  conversation: Conversation,
  conversationsConnection: Conversations,
  creditCard: CreditCard,
  curatedTrendingArtists: CuratedTrendingArtists,
  discoverArtworks: DiscoverArtworks,
  departments,
  external: externalField,
  fair: Fair,
  fairOrganizer: FairOrganizer,
  fairs: Fairs,
  fairsConnection,
  feature: Feature,
  featuredLinksConnection: FeaturedLinksConnection,
  featuresConnection: FeaturesConnection,
  filterPartners: FilterPartners,
  gene: Gene,
  geneFamiliesConnection: GeneFamilies,
  genes: Genes,
  heroUnitsConnection,
  heroUnit,
  highlights: HighlightsField,
  homePage: HomePage,
  homeView: HomeView,
  identityVerification: IdentityVerification,
  identityVerificationsConnection,
  invoice: Invoice,
  job,
  jobs,
  LikedDiscoveryArtworks,
  saleAgreement: SaleAgreement,
  saleAgreementsConnection: SaleAgreementsConnection,
  markdown: MarkdownContent,
  matchArtist: MatchArtist,
  matchConnection: MatchConnection,
  marketingCollection: MarketingCollection,
  marketingCollections: MarketingCollections,
  curatedMarketingCollections: CuratedMarketingCollections,
  marketingCategories: MarketingCategories,
  me: Me,
  node: ObjectIdentification.NodeField,
  notificationPreferences,
  notificationsConnection: NotificationsConnection,
  orderedSet: OrderedSet,
  orderedSets: OrderedSets,
  orderedSetsConnection: OrderedSetsConnection,
  page: Page,
  pagesConnection: PagesConnection,
  partner: Partner,
  partnerArtistDocumentsConnection: PartnerArtistDocumentsConnection,
  partnerArtworks: PartnerArtworks,
  partnerCategories: PartnerCategories,
  partnerCategory: PartnerCategory,
  partnersConnection: PartnersConnection,
  partnerShowDocumentsConnection: PartnerShowDocumentsConnection,
  phoneNumber: PhoneNumber,
  previewSavedSearch: PreviewSavedSearchField,
  profile: Profile,
  profilesConnection: Profiles,
  recentlySoldArtworks: RecentlySoldArtworks,
  requestLocation: RequestLocationField,
  sale: Sale,
  saleArtwork: SaleArtwork,
  saleArtworksConnection: SaleArtworksConnectionField,
  salesConnection: SalesConnectionField,
  searchConnection: Search,
  shortcut,
  show: Show,
  showsConnection: Shows,
  staticContent: StaticContent,
  system: System,
  tag: TagField,
  targetSupply: TargetSupply,
  user: UserField,
  usersConnection: Users,
  vanityURLEntity: VanityURLEntity,
  verifyAddress: VerifyAddress,
  verifyUser: VerifyUser,
  ...viewingRoomUnstitchedRootField,
}

// FIXME: Remove type once Reaction MPv2 migration is complete
const ViewerType = new GraphQLObjectType<any, ResolverContext>({
  name: "Viewer",
  description: "A wildcard used to support complex root queries in Relay",
  fields: rootFields,
})

const Viewer = {
  type: ViewerType,
  description: "A wildcard used to support complex root queries in Relay",
  resolve: (x) => x,
}

export default new GraphQLSchema({
  mutation: new GraphQLObjectType<any, ResolverContext>({
    name: "Mutation",
    fields: {
      ackTask: ackTaskMutation,
      addOrderedSetItem: addOrderedSetItemMutation,
      addUserRole: addUserRoleMutation,
      adminCreateFeatureFlag: createFeatureFlagMutation,
      adminDeleteFeatureFlag: deleteFeatureFlagMutation,
      adminToggleFeatureFlag: toggleFeatureFlagMutation,
      adminUpdateFeatureFlag: updateFeatureFlagMutation,
      artworksCollectionsBatchUpdate: artworksCollectionsBatchUpdateMutation,
      bulkUpdatePartnerArtworks: bulkUpdatePartnerArtworksMutation,
      commerceOptIn: commerceOptInMutation,
      commerceOptInReport: commerceOptInReportMutation,
      createAccountRequest: createAccountRequestMutation,
      createAlert: createAlertMutation,
      createInvoicePayment: createInvoicePaymentMutation,
      createVerifiedRepresentative: createVerifiedRepresentativeMutation,
      deleteVerifiedRepresentative: deleteVerifiedRepresentativeMutation,
      createCareerHighlight: createCareerHighlightMutation,
      updateCareerHighlight: updateCareerHighlightMutation,
      deleteCareerHighlight: deleteCareerHighlightMutation,
      createArtist: createArtistMutation,
      createBidder: createBidderMutation,
      createBidderPosition: BidderPositionMutation,
      createCollection: createCollectionMutation,
      createConsignmentInquiry: createConsignmentInquiryMutation,
      createCreditCard: createCreditCardMutation,
      createDiscoveryArtworkReference: CreateDiscoveryLikedArtworkMutation,
      createDiscoveryUser: CreateDiscoveryUserMutation,
      deleteDiscoveryUserReferences: DeleteDiscoveryUserReferencesMutation,
      createFeature: CreateFeatureMutation,
      createFeaturedLink: CreateFeaturedLinkMutation,
      createGeminiEntryForAsset: CreateGeminiEntryForAsset,
      createHeroUnit: createHeroUnitMutation,
      createIdentityVerificationOverride: createIdentityVerificationOverrideMutation,
      createSaleAgreement: CreateSaleAgreementMutation,
      createOrderedSet: createOrderedSetMutation,
      createPage: CreatePageMutation,
      createPartnerOffer: createPartnerOfferMutation,
      createUserAdminNote: createUserAdminNoteMutation,
      createUserInterest: createUserInterestMutation,
      createUserInterestForUser: createUserInterestForUser,
      createUserInterests: createUserInterestsMutation,
      createUserSaleProfile: createUserSaleProfileMutation,
      deleteAlert: deleteAlertMutation,
      deleteArtist: deleteArtistMutation,
      deleteArtworkImage: DeleteArtworkImageMutation,
      deleteBankAccount: deleteBankAccountMutation,
      deleteCollection: deleteCollectionMutation,
      deleteConversation: deleteConversationMutation,
      deleteCreditCard: deleteCreditCardMutation,
      deleteFeature: DeleteFeatureMutation,
      deleteFeaturedLink: DeleteFeaturedLinkMutation,
      deleteHeroUnit: deleteHeroUnitMutation,
      deleteMyAccountMutation: deleteUserAccountMutation,
      deleteMyUserProfileIcon: deleteCollectorProfileIconMutation,
      deleteOrderedSet: deleteOrderedSetMutation,
      deleteOrderedSetItem: deleteOrderedSetItemMutation,
      deletePage: DeletePageMutation,
      deleteUser: deleteUserMutation,
      deleteUserAdminNote: deleteUserAdminNoteMutation,
      deleteUserInterest: deleteUserInterestMutation,
      deleteUserInterestForUser: deleteUserInterestForUser,
      deleteUserInterests: deleteUserInterestsMutation,
      deleteUserRole: deleteUserRoleMutation,
      dislikeArtwork: dislikeArtworkMutation,
      dismissTask: dismissTaskMutation,
      endSale: endSaleMutation,
      followArtist: FollowArtist,
      followGene: FollowGene,
      followProfile: FollowProfile,
      followShow: FollowShow,
      linkAuthentication: linkAuthenticationMutation,
      markAllNotificationsAsRead: markAllNotificationsAsReadMutation,
      markNotificationAsRead: markNotificationAsReadMutation,
      markNotificationsAsSeen: markNotificationsAsSeenMutation,
      mergeArtists: mergeArtistsMutation,
      myCollectionCreateArtwork: myCollectionCreateArtworkMutation,
      myCollectionDeleteArtwork: myCollectionDeleteArtworkMutation,
      myCollectionUpdateArtwork: myCollectionUpdateArtworkMutation,
      requestCredentialsForAssetUpload: CreateAssetRequestLoader,
      requestPriceEstimate: requestPriceEstimateMutation,
      saveArtwork: saveArtworkMutation,
      sendConfirmationEmail: sendConfirmationEmailMutation,
      sendConversationMessage: SendConversationMessageMutation,
      sendFeedback: sendFeedbackMutation,
      sendIdentityVerificationEmail: sendIdentityVerificationEmailMutation,
      startIdentityVerification: startIdentityVerificationMutation,
      submitInquiryRequestMutation,
      triggerCampaign: triggerCampaignMutation,
      unlinkAuthentication: unlinkAuthenticationMutation,
      updateAlert: updateAlertMutation,
      updateArtist: updateArtistMutation,
      updateArtwork: updateArtworkMutation,
      updateCMSLastAccessTimestamp: updateCMSLastAccessTimestampMutation,
      updateCollection: updateCollectionMutation,
      updateMeCollectionsMutation: updateMeCollectionsMutation,
      updateCollectorProfile: UpdateCollectorProfile,
      updateCollectorProfileWithID: UpdateCollectorProfileWithID,
      updateConversation: UpdateConversationMutation,
      updateFeature: UpdateFeatureMutation,
      updateFeaturedLink: UpdateFeaturedLinkMutation,
      updateHeroUnit: updateHeroUnitMutation,
      updateSaleAgreement: UpdateSaleAgreementMutation,
      updateMessage: updateMessageMutation,
      updateMyPassword: updateMyPasswordMutation,
      updateMyUserProfile: UpdateMyUserProfileMutation,
      updateNotificationPreferences: updateNotificationPreferencesMutation,
      updateOrderedSet: updateOrderedSetMutation,
      updatePage: UpdatePageMutation,
      updatePartnerShow: updatePartnerShowMutation,
      updateQuiz: updateQuizMutation,
      updateUser: updateUserMutation,
      updateUserInterest: updateUserInterestMutation,
      updateUserInterests: updateUserInterestsMutation,
      updateUserSaleProfile: updateUserSaleProfileMutation,
      createSmsSecondFactor: createSmsSecondFactorMutation,
      updateSmsSecondFactor: updateSmsSecondFactorMutation,
      createAppSecondFactor: createAppSecondFactorMutation,
      updateAppSecondFactor: updateAppSecondFactorMutation,
      createBackupSecondFactors: createBackupSecondFactorsMutation,
      disableSecondFactor: disableSecondFactorMutation,
      deliverSecondFactor: deliverSecondFactorMutation,
      enableSecondFactor: enableSecondFactorMutation,
      createAndSendBackupSecondFactor: createAndSendBackupSecondFactorMutation,
    },
  }),
  query: new GraphQLObjectType<any, ResolverContext>({
    name: "Query",
    fields: {
      ...rootFields,
      viewer: Viewer,
    },
  }),
  // These are for orphaned types which are types which should be in the schema,
  // but can’t be discovered by traversing the types and fields from query.
  types: [
    ArtworkVersionType,
    OrderPartyUnionType,
    PaymentMethodUnion,
    WireTransferType,
    SearchableItem,
    ArtistArtworkGridType,
    AuctionArtworkGridType,
    PartnerArtworkGridType,
    RelatedArtworkGridType,
    ShowArtworkGridType,
    ArtworkOrEditionSetType,
    SearchCriteriaLabel,
    ...homeViewSectionTypes,
    BackupSecondFactor,
    AppSecondFactor,
    SmsSecondFactor,
    BackupSecondFactors,
  ],
  directives: specifiedDirectives.concat([
    PrincipalFieldDirective,
    OptionalFieldDirective,
    CacheableDirective,
  ]),
})
