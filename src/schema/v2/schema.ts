import {
  DirectiveLocation,
  GraphQLDirective,
  GraphQLObjectType,
  GraphQLSchema,
  specifiedDirectives,
} from "graphql"
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
import ArtworkAttributionClasses from "./artworkAttributionClasses"
import ArtworkMediums from "./artworkMediums"
import Artworks from "./artworks"
import { artworksCollectionsBatchUpdateMutation } from "./me/artworksCollectionsBatchUpdateMutation"
import { ArtworkVersionType } from "./artwork_version"
import CreateAssetRequestLoader from "./asset_uploads/create_asset_request_mutation"
import CreateGeminiEntryForAsset from "./asset_uploads/finalize_asset_mutation"
import { AuctionResult } from "./auction_result"
import { cities } from "./cities"
import {
  notificationPreferences,
  updateNotificationPreferencesMutation,
} from "./notification_preferences"
import { City } from "./city"
import { createAccountRequestMutation } from "./createAccountRequestMutation"
import { createCollectionMutation } from "./me/createCollectionMutation"
import { deleteCollectionMutation } from "./me/deleteCollectionMutation"
import { deleteHeroUnitMutation } from "./HeroUnit/deleteHeroUnitMutation"
import { createHeroUnitMutation } from "./HeroUnit/createHeroUnitMutation"
import { updateHeroUnitMutation } from "./HeroUnit/updateHeroUnitMutation"
import { heroUnitsConnection } from "./HeroUnit/heroUnitsConnection"
import { heroUnit } from "./HeroUnit/heroUnit"
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
import Genes from "./genes"
import GeneFamilies from "./gene_families"
import { HighlightsField } from "./Highlights"
import HomePage from "./home"
import Image from "./image"
import { ImageSearchField } from "./imageSearch"
import Me from "./me"
import { BidderPositionMutation } from "./me/bidder_position_mutation"
// import MatchGene from "./match/gene"
// import SaleArtwork from "./sale_artwork"
import MatchArtist from "./match/artist"
// import { SaleArtworksConnectionField } from "./sale_artworks"
import Conversation from ".//conversation"
import SendConversationMessageMutation from "./conversation/send_message_mutation"
import { submitInquiryRequestMutation } from "./conversation/submit_inquiry_request_mutation"
import UpdateConversationMutation from "./conversation/update_conversation_mutation"
import createBidderMutation from "./me/create_bidder_mutation"
import createCreditCardMutation from "./me/create_credit_card_mutation"
import { deleteBankAccountMutation } from "./me/delete_bank_account_mutation"
import { deleteCreditCardMutation } from "./me/delete_credit_card_mutation"
import deleteUserMutation from "./users/deleteUserMutation"
import { deleteUserRoleMutation } from "./users/deleteUserRoleMutation"
import FollowArtist from "./me/follow_artist"
import FollowGene from "./me/follow_gene"
import FollowProfile from "./me/follow_profile"
import FollowShow from "./me/follow_show"
import { myCollectionCreateArtworkMutation } from "./me/myCollectionCreateArtworkMutation"
import { myCollectionDeleteArtworkMutation } from "./me/myCollectionDeleteArtworkMutation"
import { myCollectionUpdateArtworkMutation } from "./me/myCollectionUpdateArtworkMutation"
import saveArtworkMutation from "./me/saveArtworkMutation"
import dislikeArtworkMutation from "./me/dislikeArtworkMutation"
import { sendConfirmationEmailMutation } from "./me/sendConfirmationEmailMutation"
import { updateCollectionMutation } from "./me/updateCollectionMutation"
import UpdateCollectorProfile from "./me/update_collector_profile"
import UpdateCollectorProfileWithID from "./CollectorProfile/mutations/updateCollectorProfileWithID"
import UpdateMyUserProfileMutation from "./me/update_me_mutation"
import { updateMyPasswordMutation } from "./me/updateMyPasswordMutation"
import { updateArtistMutation } from "./artist/updateArtistMutation"
import { updateUserMutation } from "./users/updateUserMutation"
import { addUserRoleMutation } from "./users/addUserRoleMutation"
import { createUserAdminNoteMutation } from "./users/createUserAdminNoteMutation"
import { deleteUserAdminNoteMutation } from "./users/deleteUserAdminNoteMutation"
import { updateUserSaleProfileMutation } from "./users/updateUserSaleProfileMutation"
import { deleteCollectorProfileIconMutation } from "./me/deleteCollectorProfileIconMutation"
import ObjectIdentification from "./object_identification"
import { OrderedSet } from "./OrderedSet"
import { createOrderedSetMutation } from "./OrderedSet/createOrderedSetMutation"
import { deleteOrderedSetItemMutation } from "./OrderedSet/deleteOrderedSetItemMutation"
import { updateOrderedSetMutation } from "./OrderedSet/updateOrderedSetMutation"
import { deleteOrderedSetMutation } from "./OrderedSet/deleteOrderedSetMutation"
import { addOrderedSetItemMutation } from "./OrderedSet/addOrderedSetItemMutation"
import OrderedSets from "./OrderedSet/orderedSets"
import Partner from "schema/v2/partner/partner"
import PartnerArtworks from "./partner/partnerArtworks"
import Profile from "./profile"
// import Partner from "schema/v2/partner/partner"
import { PartnersConnection } from "./partner/partners"
import { RequestLocationField } from "./requestLocation"
import { ReverseImageSearch } from "./reverseImageSearch"
import { endSaleMutation } from "./sale/end_sale_mutation"
import Sale from "./sale/index"
import { SalesConnectionField } from "./sales"
import SaleArtwork from "./sale_artwork"
import { SaleArtworksConnectionField } from "./sale_artworks"
import { Search } from "./search"
import { SearchableItem } from "./SearchableItem"
import { sendFeedbackMutation } from "./sendFeedbackMutation"
import Show from "./show"
import { Shows } from "./shows"
import { startIdentityVerificationMutation } from "./startIdentityVerificationMutation"
import StaticContent from "./static_content"
import System from "./system"
import PartnerCategory from "./partner/partner_category"
import PartnerCategories from "./partner/partner_categories"
// import SuggestedGenes from "./suggested_genes"
import { TagField } from "./tag"
import { TargetSupply } from "./TargetSupply"
import { UserField } from "./user"
// import TrendingArtists from "./artists/trending"
import { Users } from "./users"
import VanityURLEntity from "./vanityURLEntity"
import FairOrganizer from "./fair_organizer"
import { externalField } from "./External/External"
import { createUserInterestMutation } from "./me/createUserInterestMutation"
import { createUserInterestForUser } from "./users/createUserInterestForUserMutation"
import { Page } from "./Page/Page"
import { deleteUserInterestMutation } from "./me/deleteUserInterestMutation"
import { deleteUserInterestForUser } from "./users/deleteUserInterestForUserMutation"
import { PhoneNumber } from "./phoneNumber"
import { unlinkAuthenticationMutation } from "./me/unlinkAuthenticationMutation"
import { linkAuthenticationMutation } from "./me/linkAuthenticationMutation"
import { authenticationStatus } from "./authenticationStatus"
import { deleteUserAccountMutation } from "./me/delete_account_mutation"
import { SearchCriteriaLabel } from "./searchCriteriaLabel"
import { sendIdentityVerificationEmailMutation } from "./me/sendIdentityVerficationEmailMutation"
import { requestPriceEstimateMutation } from "./me/requestPriceEstimate"
import { PreviewSavedSearchField } from "./previewSavedSearch"
import { shortcut } from "./shortcut"
import { channel } from "./article/channel"
import { departments, job, jobs } from "./jobs"
import { RecentlySoldArtworks } from "./recentlySoldArtworks"
import { artworksForUser } from "./artworksForUser"
import {
  IdentityVerification,
  identityVerificationsConnection,
} from "./identityVerification"
import { createIdentityVerificationOverrideMutation } from "./createIdentityVerificationOverrideMutation"
import { BankAccount } from "./bank_account"
import { WireTransferType, PaymentMethodUnion } from "./payment_method_union"
import { AdminField } from "./admin"
import { createFeatureFlagMutation } from "./admin/mutations/createFeatureFlagMutation"
import { deleteFeatureFlagMutation } from "./admin/mutations/deleteFeatureFlagMutation"
import { updateFeatureFlagMutation } from "./admin/mutations/updateFeatureFlagMutation"
import { toggleFeatureFlagMutation } from "./admin/mutations/toggleFeatureFlagMutation"
import { MatchConnection } from "./Match"
import { PartnerArtistDocumentsConnection } from "./partner/partnerArtistDocumentsConnection"
import { PartnerShowDocumentsConnection } from "./partner/partnerShowDocumentsConnection"
import { bulkUpdatePartnerArtworksMutation } from "./bulkUpdatePartnerArtworksMutation"
import { NotificationsConnection } from "./notifications"
import { markAllNotificationsAsReadMutation } from "./me/mark_all_notifications_as_read_mutation"
import { markNotificationAsReadMutation } from "./me/mark_notification_as_read_mutation"
import { markNotificationsAsSeenMutation } from "./me/markNotificationsAsSeenMutation"
import updateMessageMutation from "./conversation/updateMessageMutation"
import deleteConversationMutation from "./conversation/deleteConversationMutation"
import { updateArtworkMutation } from "./artwork/updateArtworkMutation"
import { updateCMSLastAccessTimestampMutation } from "./partner/updateCMSLastAccessTimestampMutation"
import { createConsignmentInquiryMutation } from "./consignments/createConsignmentInquiryMutation"
import Conversations from "./conversation/conversations"
import { updateQuizMutation } from "schema/v2/updateQuizMutation"
import { OrderedSetsConnection } from "./OrderedSet/orderedSetsConnection"
import { triggerCampaignMutation } from "./me/triggerCampaignMutation"
import { FeaturesConnection } from "./Feature/FeaturesConnection"
import { CreateFeatureMutation } from "./Feature/CreateFeatureMutation"
import { UpdateFeatureMutation } from "./Feature/UpdateFeatureMutation"
import { DeleteFeatureMutation } from "./Feature/DeleteFeatureMutation"
import { FeaturedLinksConnection } from "./FeaturedLink/featuredLinksConnection"
import { CreateFeaturedLinkMutation } from "./FeaturedLink/createFeaturedLinkMutation"
import { UpdateFeaturedLinkMutation } from "./FeaturedLink/updateFeaturedLinkMutation"
import { DeleteFeaturedLinkMutation } from "./FeaturedLink/deleteFeaturedLinkMutation"
import { createUserSaleProfileMutation } from "./users/createUserSaleProfileMutation"
import { MarkdownContent } from "./markdownContent"
import { CollectorProfileForUser } from "./CollectorProfile/collectorProfile"
import { PagesConnection } from "./Page/PagesConnection"
import { CreatePageMutation } from "./Page/CreatePageMutation"
import { DeletePageMutation } from "./Page/DeletePageMutation"
import { UpdatePageMutation } from "./Page/UpdatePageMutation"
import { createArtistMutation } from "./artist/createArtistMutation"
import { CollectorProfilesConnection } from "./CollectorProfile/collectorProfiles"
import { VerifyAddress } from "./verifyAddress"
import { Profiles } from "./profiles"

const PrincipalFieldDirective = new GraphQLDirective({
  name: "principalField",
  locations: [DirectiveLocation.FIELD],
})

const OptionalFieldDirective = new GraphQLDirective({
  name: "optionalField",
  locations: [DirectiveLocation.FIELD],
})

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
  artwork: Artwork,
  artworkAttributionClasses: ArtworkAttributionClasses,
  artworkMediums: ArtworkMediums,
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
  departments,
  doNotUseImageSearch: ImageSearchField,
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
  identityVerification: IdentityVerification,
  identityVerificationsConnection,
  job,
  jobs,
  markdown: MarkdownContent,
  matchArtist: MatchArtist,
  matchConnection: MatchConnection,
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
  reverseImageSearch: ReverseImageSearch,
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
      addOrderedSetItem: addOrderedSetItemMutation,
      addUserRole: addUserRoleMutation,
      adminCreateFeatureFlag: createFeatureFlagMutation,
      adminDeleteFeatureFlag: deleteFeatureFlagMutation,
      adminToggleFeatureFlag: toggleFeatureFlagMutation,
      adminUpdateFeatureFlag: updateFeatureFlagMutation,
      artworksCollectionsBatchUpdate: artworksCollectionsBatchUpdateMutation,
      bulkUpdatePartnerArtworks: bulkUpdatePartnerArtworksMutation,
      createAccountRequest: createAccountRequestMutation,
      createArtist: createArtistMutation,
      createBidder: createBidderMutation,
      createBidderPosition: BidderPositionMutation,
      createConsignmentInquiry: createConsignmentInquiryMutation,
      createCollection: createCollectionMutation,
      createCreditCard: createCreditCardMutation,
      createGeminiEntryForAsset: CreateGeminiEntryForAsset,
      createFeature: CreateFeatureMutation,
      createFeaturedLink: CreateFeaturedLinkMutation,
      createIdentityVerificationOverride: createIdentityVerificationOverrideMutation,
      createOrderedSet: createOrderedSetMutation,
      createPage: CreatePageMutation,
      createUserAdminNote: createUserAdminNoteMutation,
      createUserInterest: createUserInterestMutation,
      createUserInterestForUser: createUserInterestForUser,
      createUserSaleProfile: createUserSaleProfileMutation,
      deleteArtworkImage: DeleteArtworkImageMutation,
      deleteBankAccount: deleteBankAccountMutation,
      deleteCollection: deleteCollectionMutation,
      deleteConversation: deleteConversationMutation,
      deleteCreditCard: deleteCreditCardMutation,
      deleteFeature: DeleteFeatureMutation,
      deleteFeaturedLink: DeleteFeaturedLinkMutation,
      deleteHeroUnit: deleteHeroUnitMutation,
      createHeroUnit: createHeroUnitMutation,
      updateHeroUnit: updateHeroUnitMutation,
      deleteMyAccountMutation: deleteUserAccountMutation,
      deleteMyUserProfileIcon: deleteCollectorProfileIconMutation,
      deleteOrderedSet: deleteOrderedSetMutation,
      deleteOrderedSetItem: deleteOrderedSetItemMutation,
      deletePage: DeletePageMutation,
      deleteUser: deleteUserMutation,
      deleteUserAdminNote: deleteUserAdminNoteMutation,
      deleteUserInterest: deleteUserInterestMutation,
      deleteUserInterestForUser: deleteUserInterestForUser,
      deleteUserRole: deleteUserRoleMutation,
      dislikeArtwork: dislikeArtworkMutation,
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
      updateArtwork: updateArtworkMutation,
      updateCMSLastAccessTimestamp: updateCMSLastAccessTimestampMutation,
      updateCollection: updateCollectionMutation,
      updateCollectorProfile: UpdateCollectorProfile,
      updateCollectorProfileWithID: UpdateCollectorProfileWithID,
      updateConversation: UpdateConversationMutation,
      updateFeature: UpdateFeatureMutation,
      updateFeaturedLink: UpdateFeaturedLinkMutation,
      updateMessage: updateMessageMutation,
      updateMyPassword: updateMyPasswordMutation,
      updateMyUserProfile: UpdateMyUserProfileMutation,
      updateNotificationPreferences: updateNotificationPreferencesMutation,
      updateOrderedSet: updateOrderedSetMutation,
      updatePage: UpdatePageMutation,
      updateUser: updateUserMutation,
      updateArtist: updateArtistMutation,
      updateUserSaleProfile: updateUserSaleProfileMutation,
      updateQuiz: updateQuizMutation,
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
  ],
  directives: specifiedDirectives.concat([
    PrincipalFieldDirective,
    OptionalFieldDirective,
  ]),
})
