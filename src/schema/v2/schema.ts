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
import { Author, AuthorsConnection } from "./author"
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
import {
  UserAddressType,
  UserAddressOrErrorsUnion,
} from "./me/userAddress/index"
import {
  createUserAddressMutation,
  updateUserAddressMutation,
  deleteUserAddressMutation,
  updateUserDefaultAddressMutation,
} from "./me/userAddress/mutations"
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
import { createCanonicalArtistMutation } from "./artist/createCanonicalArtistMutation"
import { deleteArtistMutation } from "./artist/deleteArtistMutation"
import { createArtworkMutation } from "./artwork/createArtworkMutation"
import { deleteArtworkMutation } from "./artwork/deleteArtworkMutation"
import { updateArtworkMutation } from "./artwork/updateArtworkMutation"
import { artworksForUser } from "./artworksForUser"
import { authenticationStatus } from "./authenticationStatus"
import { BankAccount } from "./bank_account"
import { bulkUpdateArtworksMetadataMutation } from "./partner/BulkOperation/bulkUpdateArtworksMetadataMutation"
import { artsyShippingOptInMutation } from "./partner/ArtsyShippingOptIn/artsyShippingOptInMutation"
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
import { sendIdentityVerificationEmailMutation } from "./me/sendIdentityVerificationEmailMutation"
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
import { updatePartnerFlagsMutation } from "./partner/updatePartnerFlagsMutation"
import { updatePartnerMutation } from "./partner/updatePartnerMutation"
import { updateProfileMutation } from "./profile/updateProfileMutation"
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
import { discoveryCategoriesConnection } from "./discoveryCategoriesConnection"
import { discoveryCategoryConnection } from "./discoveryCategoryConnection"
import { discoveryCategoryArtworksConnection } from "./discoveryCategoryArtworksConnection"
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
  DiscoveryMarketingCollections,
} from "./marketingCollections"
import { MarketingCategories } from "./marketingCategories"
import { createCareerHighlightMutation } from "./careerHighlight/createCareerHighlightMutation"
import { deleteCareerHighlightMutation } from "./careerHighlight/deleteCareerHighlightMutation"
import { updateCareerHighlightMutation } from "./careerHighlight/updateCareerHighlightMutation"
import { addArtworkToPartnerShowMutation } from "./Show/addArtworkToPartnerShowMutation"
import { addInstallShotToPartnerShowMutation } from "./Show/addInstallShotToPartnerShowMutation"
import { createPartnerShowMutation } from "./Show/createPartnerShowMutation"
import { createPartnerShowEventMutation } from "./Show/createPartnerShowEventMutation"
import { createPartnerShowDocumentMutation } from "./Show/createPartnerShowDocumentMutation"
import { deletePartnerShowMutation } from "./Show/deletePartnerShowMutation"
import { deletePartnerShowEventMutation } from "./Show/deletePartnerShowEventMutation"
import { deletePartnerShowDocumentMutation } from "./Show/deletePartnerShowDocumentMutation"
import { removeArtworkFromPartnerShowMutation } from "./Show/removeArtworkFromPartnerShowMutation"
import { removeInstallShotFromPartnerShowMutation } from "./Show/removeInstallShotFromPartnerShowMutation"
import { repositionArtworksInPartnerShowMutation } from "./Show/repositionArtworksInPartnerShowMutation"
import { repositionInstallShotsInPartnerShowMutation } from "./Show/repositionInstallShotsInPartnerShowMutation"
import { updateInstallShotForPartnerShowMutation } from "./Show/updateInstallShotForPartnerShowMutation"
import { updatePartnerShowMutation } from "./Show/updatePartnerShowMutation"
import { updatePartnerShowEventMutation } from "./Show/updatePartnerShowEventMutation"
import { updatePartnerShowDocumentMutation } from "./Show/updatePartnerShowDocumentMutation"
import { createPartnerArtistDocumentMutation } from "./partner/Mutations/PartnerArtist/createPartnerArtistDocumentMutation"
import { deletePartnerArtistDocumentMutation } from "./partner/Mutations/PartnerArtist/deletePartnerArtistDocumentMutation"
import { deletePartnerArtistMutation } from "./partner/Mutations/PartnerArtist/deletePartnerArtistMutation"
import { repositionPartnerArtistArtworksMutation } from "./partner/Mutations/PartnerArtist/repositionPartnerArtistArtworksMutation"
import { updatePartnerArtistDocumentMutation } from "./partner/Mutations/PartnerArtist/updatePartnerArtistDocumentMutation"
import { assignArtistToPartnerMutation } from "./partner/Mutations/PartnerArtist/assignArtistToPartnerMutation"
import { updatePartnerArtistMutation } from "./partner/Mutations/PartnerArtist/updatePartnerArtistMutation"
import { VerifyUser } from "./verifyUser"
import { ArtistSeries, ArtistSeriesConnection } from "./artistSeries"
import { homeViewSectionTypes } from "./homeView/sectionTypes"
import { CacheableDirective } from "directives/cacheableDirective"
import { OptionalFieldDirective } from "directives/optionalField/optionalFieldsDirectiveExtension"
import { PrincipalFieldDirective } from "directives/principalField/principalFieldDirectiveExtension"
import { commerceOptInMutation } from "./partner/CommerceOptIn/commerceOptInMutation"
import { commerceOptInReportMutation } from "./partner/CommerceOptIn/commerceOptInReportMutation"
import { ViewingRoom } from "./viewingRoom"
import { ViewingRoomsConnection } from "./viewingRoomConnection"
import { Invoice } from "./Invoice/invoice"
import { createInvoicePaymentMutation } from "./Invoice/createInvoicePaymentMutation"
import { ackTaskMutation } from "./me/ack_task_mutation"
import { DiscoverArtworks } from "./infiniteDiscovery/discoverArtworks"
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
import { createViewingRoomMutation } from "./viewingRooms/mutations/createViewingRoomMutation"
import { createUserSeenArtworkMutation } from "./infiniteDiscovery/createUserSeenArtworkMutation"
import { excludeArtistFromDiscoveryMutation } from "./infiniteDiscovery/excludeArtistFromDiscoveryMutation"
import { updateViewingRoomMutation } from "./viewingRooms/mutations/updateViewingRoomMutation"
import { deleteViewingRoomMutation } from "./viewingRooms/mutations/deleteViewingRoomMutation"
import { publishViewingRoomMutation } from "./viewingRooms/mutations/publishViewingRoomMutation"
import { unpublishViewingRoomMutation } from "./viewingRooms/mutations/unpublishViewingRoomMutation"
import { updateViewingRoomArtworksMutation } from "./viewingRooms/mutations/updateViewingRoomArtworks"
import { updateViewingRoomSubsectionsMutation } from "./viewingRooms/mutations/updateViewingRoomSubsections"
import { ViewingRoomConnection } from "./viewingRooms"
import { Collection } from "./collection"
import { CreateArtworkImportMutation } from "./ArtworkImport/mutations/createArtworkImportMutation"
import { ArtworkImport } from "./ArtworkImport/artworkImport"
import { UpdateArtworkImportMutation } from "./ArtworkImport/mutations/updateArtworkImportMutation"
import { UpdateArtworkImportRowMutation } from "./ArtworkImport/mutations/updateArtworkImportRowMutation"
import { CreateArtworkImportArtworksMutation } from "./ArtworkImport/mutations/createArtworkImportArtworksMutation"
import { CreateArtworkImportArtistMatchMutation } from "./ArtworkImport/mutations/createArtworkImportArtistMatchMutation"
import { CreateArtworkImportArtistAssignmentMutation } from "./ArtworkImport/mutations/createArtworkImportArtistAssignmentMutation"
import { CreateArtworkImportImageMatchMutation } from "./ArtworkImport/mutations/createArtworkImportImageMatchMutation"
import { CreateArtworkImportCellFlagMutation } from "./ArtworkImport/mutations/createArtworkImportCellFlagMutation"
import { BatchArtworkImportImagesMutation } from "./ArtworkImport/mutations/batchArtworkImportImagesMutation"
import { UpdateArtworkImportRowImagesMutation } from "./ArtworkImport/mutations/updateArtworkImportRowImagesMutation"
import { RemoveArtworkImportImageMutation } from "./ArtworkImport/mutations/removeArtworkImportImageMutation"
import { FeaturedFairs } from "./FeaturedFairs/featuredFairs"
import {
  updateOrderMutation,
  setOrderFulfillmentOptionMutation,
  submitOrderMutation,
} from "./order"
import { CreatePartnerContactMutation } from "./partner/Settings/createPartnerContactMutation"
import { CreatePartnerLocationMutation } from "./partner/Settings/createPartnerLocationMutation"
import { UpdatePartnerContactMutation } from "./partner/Settings/updatePartnerContactMutation"
import { DeletePartnerContactMutation } from "./partner/Settings/deletePartnerContactMutation"
import { unsetOrderFulfillmentOptionMutation } from "./order/unsetOrderFulfillmentOptionMutation"
import { unsetOrderPaymentMethodMutation } from "./order/unsetOrderPaymentMethodMutation"
import { UpdatePartnerLocationMutation } from "./partner/Settings/updatePartnerLocationMutation"
import { DeletePartnerLocationMutation } from "./partner/Settings/deletePartnerLocationMutation"
import { repositionPartnerLocationsMutation } from "./partner/Settings/repositionPartnerLocations"
import { PartnerMatch } from "./match/partner"
import { CreatePartnerLocationDaySchedulesMutation } from "./partner/Settings/createPartnerLocationDaySchedulesMutation"
import { UpdatePartnerProfileImageMutation } from "./partner/Settings/updatePartnerProfileImageMutation"
import { PurchasesConnection } from "./purchases"
import { Purchase } from "./purchase"
import { updateOrderShippingAddressMutation } from "./order/updateOrderShippingAddressMutation"
import { updatePurchaseMutation } from "./Purchases/updatePurchaseMutation"
import { deletePurchaseMutation } from "./Purchases/deletePurchaseMutation"
import { createPurchaseMutation } from "./Purchases/createPurchaseMutation"
import { bulkAddArtworksToShowMutation } from "./partner/BulkOperation/bulkAddArtworksToShowMutation"
import { BasedOnUserSaves } from "./basedOnUserSaves/basedOnUserSaves"

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
  artworkImport: ArtworkImport,
  artworkResult: ArtworkResult,
  artworks: Artworks,
  artworksConnection: filterArtworksConnection(),
  artworksForUser,
  auctionResult: AuctionResult,
  authenticationStatus,
  author: Author,
  authorsConnection: AuthorsConnection,
  bankAccount: BankAccount,
  basedOnUserSaves: BasedOnUserSaves,
  channel,
  cities,
  city: City,
  collection: Collection,
  collectorProfile: CollectorProfileForUser,
  collectorProfilesConnection: CollectorProfilesConnection,
  conversation: Conversation,
  conversationsConnection: Conversations,
  creditCard: CreditCard,
  curatedTrendingArtists: CuratedTrendingArtists,
  discoverArtworks: DiscoverArtworks,
  discoveryCategoriesConnection,
  discoveryCategoryConnection,
  discoveryCategoryArtworksConnection,
  departments,
  external: externalField,
  fair: Fair,
  fairOrganizer: FairOrganizer,
  fairs: Fairs,
  fairsConnection,
  feature: Feature,
  featuredFairs: FeaturedFairs,
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
  saleAgreement: SaleAgreement,
  saleAgreementsConnection: SaleAgreementsConnection,
  markdown: MarkdownContent,
  matchArtist: MatchArtist,
  matchPartner: PartnerMatch,
  matchConnection: MatchConnection,
  marketingCollection: MarketingCollection,
  marketingCollections: MarketingCollections,
  curatedMarketingCollections: CuratedMarketingCollections,
  discoveryMarketingCollections: DiscoveryMarketingCollections,
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
  purchase: Purchase,
  purchasesConnection: PurchasesConnection,
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
  viewingRoom: ViewingRoom,
  viewingRoomsConnection: ViewingRoomsConnection,
  viewingRooms: ViewingRoomConnection,
  verifyAddress: VerifyAddress,
  verifyUser: VerifyUser,
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
      addArtworkToPartnerShow: addArtworkToPartnerShowMutation,
      addInstallShotToPartnerShow: addInstallShotToPartnerShowMutation,
      addOrderedSetItem: addOrderedSetItemMutation,
      addUserRole: addUserRoleMutation,
      adminCreateFeatureFlag: createFeatureFlagMutation,
      adminDeleteFeatureFlag: deleteFeatureFlagMutation,
      adminToggleFeatureFlag: toggleFeatureFlagMutation,
      adminUpdateFeatureFlag: updateFeatureFlagMutation,
      artsyShippingOptIn: artsyShippingOptInMutation,
      artworksCollectionsBatchUpdate: artworksCollectionsBatchUpdateMutation,
      bulkAddArtworksToShow: bulkAddArtworksToShowMutation,
      bulkUpdateArtworksMetadata: bulkUpdateArtworksMetadataMutation,
      commerceOptIn: commerceOptInMutation,
      commerceOptInReport: commerceOptInReportMutation,
      createAccountRequest: createAccountRequestMutation,
      createAlert: createAlertMutation,
      createArtwork: createArtworkMutation,
      createAndSendBackupSecondFactor: createAndSendBackupSecondFactorMutation,
      createAppSecondFactor: createAppSecondFactorMutation,
      createArtist: createArtistMutation,
      createArtworkImport: CreateArtworkImportMutation,
      createBackupSecondFactors: createBackupSecondFactorsMutation,
      createBidder: createBidderMutation,
      createBidderPosition: BidderPositionMutation,
      createCanonicalArtist: createCanonicalArtistMutation,
      createCareerHighlight: createCareerHighlightMutation,
      createCollection: createCollectionMutation,
      createConsignmentInquiry: createConsignmentInquiryMutation,
      createCreditCard: createCreditCardMutation,
      createFeature: CreateFeatureMutation,
      createFeaturedLink: CreateFeaturedLinkMutation,
      createGeminiEntryForAsset: CreateGeminiEntryForAsset,
      createHeroUnit: createHeroUnitMutation,
      createIdentityVerificationOverride: createIdentityVerificationOverrideMutation,
      createInvoicePayment: createInvoicePaymentMutation,
      createOrderedSet: createOrderedSetMutation,
      createPartnerContact: CreatePartnerContactMutation,
      createPartnerLocation: CreatePartnerLocationMutation,
      createPartnerLocationDaySchedules: CreatePartnerLocationDaySchedulesMutation,
      createPartnerArtistDocument: createPartnerArtistDocumentMutation,
      createPartnerShow: createPartnerShowMutation,
      createPartnerShowDocument: createPartnerShowDocumentMutation,
      createPartnerShowEvent: createPartnerShowEventMutation,
      createPage: CreatePageMutation,
      createPartnerOffer: createPartnerOfferMutation,
      createPurchase: createPurchaseMutation,
      createSaleAgreement: CreateSaleAgreementMutation,
      createSmsSecondFactor: createSmsSecondFactorMutation,
      createUserAdminNote: createUserAdminNoteMutation,
      createUserAddress: createUserAddressMutation,
      createUserInterest: createUserInterestMutation,
      createUserInterestForUser: createUserInterestForUser,
      createUserInterests: createUserInterestsMutation,
      createUserSaleProfile: createUserSaleProfileMutation,
      createUserSeenArtwork: createUserSeenArtworkMutation,
      excludeArtistFromDiscovery: excludeArtistFromDiscoveryMutation,
      createVerifiedRepresentative: createVerifiedRepresentativeMutation,
      createViewingRoom: createViewingRoomMutation,
      deleteAlert: deleteAlertMutation,
      deleteArtist: deleteArtistMutation,
      deleteArtwork: deleteArtworkMutation,
      deleteArtworkImage: DeleteArtworkImageMutation,
      deleteBankAccount: deleteBankAccountMutation,
      deleteCareerHighlight: deleteCareerHighlightMutation,
      deleteCollection: deleteCollectionMutation,
      deleteConversation: deleteConversationMutation,
      deleteCreditCard: deleteCreditCardMutation,
      deleteFeature: DeleteFeatureMutation,
      deleteFeaturedLink: DeleteFeaturedLinkMutation,
      deleteHeroUnit: deleteHeroUnitMutation,
      deletePartnerArtist: deletePartnerArtistMutation,
      deletePartnerContact: DeletePartnerContactMutation,
      deletePartnerArtistDocument: deletePartnerArtistDocumentMutation,
      deletePartnerLocation: DeletePartnerLocationMutation,
      deletePartnerShow: deletePartnerShowMutation,
      deletePartnerShowDocument: deletePartnerShowDocumentMutation,
      deletePartnerShowEvent: deletePartnerShowEventMutation,
      deleteMyAccountMutation: deleteUserAccountMutation,
      deleteMyUserProfileIcon: deleteCollectorProfileIconMutation,
      deleteOrderedSet: deleteOrderedSetMutation,
      deleteOrderedSetItem: deleteOrderedSetItemMutation,
      deletePage: DeletePageMutation,
      deletePurchase: deletePurchaseMutation,
      deleteUser: deleteUserMutation,
      deleteUserAdminNote: deleteUserAdminNoteMutation,
      deleteUserAddress: deleteUserAddressMutation,
      deleteUserInterest: deleteUserInterestMutation,
      deleteUserInterestForUser: deleteUserInterestForUser,
      deleteUserInterests: deleteUserInterestsMutation,
      deleteUserRole: deleteUserRoleMutation,
      deleteVerifiedRepresentative: deleteVerifiedRepresentativeMutation,
      deleteViewingRoom: deleteViewingRoomMutation,
      deliverSecondFactor: deliverSecondFactorMutation,
      disableSecondFactor: disableSecondFactorMutation,
      dislikeArtwork: dislikeArtworkMutation,
      dismissTask: dismissTaskMutation,
      enableSecondFactor: enableSecondFactorMutation,
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
      publishViewingRoom: publishViewingRoomMutation,
      removeArtworkFromPartnerShow: removeArtworkFromPartnerShowMutation,
      removeInstallShotFromPartnerShow: removeInstallShotFromPartnerShowMutation,
      repositionArtworksInPartnerShow: repositionArtworksInPartnerShowMutation,
      repositionInstallShotsInPartnerShow: repositionInstallShotsInPartnerShowMutation,
      repositionPartnerArtistArtworks: repositionPartnerArtistArtworksMutation,
      repositionPartnerLocations: repositionPartnerLocationsMutation,
      requestCredentialsForAssetUpload: CreateAssetRequestLoader,
      requestPriceEstimate: requestPriceEstimateMutation,
      saveArtwork: saveArtworkMutation,
      sendConfirmationEmail: sendConfirmationEmailMutation,
      sendConversationMessage: SendConversationMessageMutation,
      sendFeedback: sendFeedbackMutation,
      sendIdentityVerificationEmail: sendIdentityVerificationEmailMutation,
      setOrderFulfillmentOption: setOrderFulfillmentOptionMutation,
      startIdentityVerification: startIdentityVerificationMutation,
      submitInquiryRequestMutation,
      submitOrder: submitOrderMutation,
      triggerCampaign: triggerCampaignMutation,
      unlinkAuthentication: unlinkAuthenticationMutation,
      unpublishViewingRoom: unpublishViewingRoomMutation,
      unsetOrderFulfillmentOption: unsetOrderFulfillmentOptionMutation,
      unsetOrderPaymentMethod: unsetOrderPaymentMethodMutation,
      updateAlert: updateAlertMutation,
      updateAppSecondFactor: updateAppSecondFactorMutation,
      updateArtist: updateArtistMutation,
      updateArtwork: updateArtworkMutation,
      updateArtworkImport: UpdateArtworkImportMutation,
      updateArtworkImportRow: UpdateArtworkImportRowMutation,
      createArtworkImportArtworks: CreateArtworkImportArtworksMutation,
      createArtworkImportArtistMatch: CreateArtworkImportArtistMatchMutation,
      createArtworkImportArtistAssignment: CreateArtworkImportArtistAssignmentMutation,
      createArtworkImportImageMatch: CreateArtworkImportImageMatchMutation,
      createArtworkImportCellFlag: CreateArtworkImportCellFlagMutation,
      batchArtworkImportImages: BatchArtworkImportImagesMutation,
      updateArtworkImportRowImages: UpdateArtworkImportRowImagesMutation,
      removeArtworkImportImage: RemoveArtworkImportImageMutation,
      updateCareerHighlight: updateCareerHighlightMutation,
      updateCMSLastAccessTimestamp: updateCMSLastAccessTimestampMutation,
      updateCollection: updateCollectionMutation,
      updateCollectorProfile: UpdateCollectorProfile,
      updateCollectorProfileWithID: UpdateCollectorProfileWithID,
      updateConversation: UpdateConversationMutation,
      updateFeature: UpdateFeatureMutation,
      updateFeaturedLink: UpdateFeaturedLinkMutation,
      updateHeroUnit: updateHeroUnitMutation,
      updateMeCollectionsMutation: updateMeCollectionsMutation,
      updateMessage: updateMessageMutation,
      updateMyPassword: updateMyPasswordMutation,
      updateMyUserProfile: UpdateMyUserProfileMutation,
      updateNotificationPreferences: updateNotificationPreferencesMutation,
      updateOrder: updateOrderMutation,
      updateOrderShippingAddress: updateOrderShippingAddressMutation,
      updateOrderedSet: updateOrderedSetMutation,
      updatePage: UpdatePageMutation,
      updatePurchase: updatePurchaseMutation,
      updatePartnerContact: UpdatePartnerContactMutation,
      updatePartnerLocation: UpdatePartnerLocationMutation,
      updatePartnerProfileImage: UpdatePartnerProfileImageMutation,
      updatePartnerShow: updatePartnerShowMutation,
      updateQuiz: updateQuizMutation,
      updateSaleAgreement: UpdateSaleAgreementMutation,
      updateSmsSecondFactor: updateSmsSecondFactorMutation,
      updateInstallShotForPartnerShow: updateInstallShotForPartnerShowMutation,
      assignArtistToPartner: assignArtistToPartnerMutation,
      updatePartnerArtist: updatePartnerArtistMutation,
      updatePartnerArtistDocument: updatePartnerArtistDocumentMutation,
      updatePartnerShowDocument: updatePartnerShowDocumentMutation,
      updatePartnerShowEvent: updatePartnerShowEventMutation,
      updatePartner: updatePartnerMutation,
      updatePartnerFlags: updatePartnerFlagsMutation,
      updateProfile: updateProfileMutation,
      updateUser: updateUserMutation,
      updateUserInterest: updateUserInterestMutation,
      updateUserInterests: updateUserInterestsMutation,
      updateUserSaleProfile: updateUserSaleProfileMutation,
      updateViewingRoom: updateViewingRoomMutation,
      updateViewingRoomArtworks: updateViewingRoomArtworksMutation,
      updateViewingRoomSubsections: updateViewingRoomSubsectionsMutation,
      updateUserAddress: updateUserAddressMutation,
      updateUserDefaultAddress: updateUserDefaultAddressMutation,
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
    UserAddressType,
    UserAddressOrErrorsUnion,
  ],
  directives: specifiedDirectives.concat([
    PrincipalFieldDirective,
    OptionalFieldDirective,
    CacheableDirective,
  ]),
})
