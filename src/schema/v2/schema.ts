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
// import MatchArtist from "./match/artist"
// import { SaleArtworksConnectionField } from "./sale_artworks"
import Conversation from "./me/conversation"
import SendConversationMessageMutation from "./me/conversation/send_message_mutation"
import { submitInquiryRequestMutation } from "./me/conversation/submit_inquiry_request_mutation"
import UpdateConversationMutation from "./me/conversation/update_conversation_mutation"
import createBidderMutation from "./me/create_bidder_mutation"
import createCreditCardMutation from "./me/create_credit_card_mutation"
import { deleteBankAccountMutation } from "./me/delete_bank_account_mutation"
import { deleteCreditCardMutation } from "./me/delete_credit_card_mutation"
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
import { updateMyPasswordMutation } from "./me/updateMyPasswordMutation"
import { updateUserMutation } from "./users/updateUserMutation"
import { updateUserSaleProfileMutation } from "./users/updateUserSaleProfileMutation"
import { deleteCollectorProfileIconMutation } from "./me/deleteCollectorProfileIconMutation"
import ObjectIdentification from "./object_identification"
import { OrderedSet } from "./OrderedSet"
import OrderedSets from "./ordered_sets"
import Partner from "./partner"
import PartnerArtworks from "./partnerArtworks"
// import Profile from "./profile"
// import Partner from "./partner"
import { PartnersConnection } from "./partners"
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
import PartnerCategory from "./partner_category"
import PartnerCategories from "./partner_categories"
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
import { page } from "./page"
import { deleteUserInterestMutation } from "./me/deleteUserInterestMutation"
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

const PrincipalFieldDirective = new GraphQLDirective({
  name: "principalField",
  locations: [DirectiveLocation.FIELD],
})

const OptionalFieldDirective = new GraphQLDirective({
  name: "optionalField",
  locations: [DirectiveLocation.FIELD],
})

const rootFields = {
  admin: AdminField,
  artworksForUser,
  artworkAttributionClasses: ArtworkAttributionClasses,
  artworkMediums: ArtworkMediums,
  auctionResult: AuctionResult,
  article: Article,
  articles: Articles,
  articlesConnection: ArticlesConnection,
  artwork: Artwork,
  // artworkVersion: ArtworkVersionResolver,
  artworksConnection: filterArtworksConnection(),
  artworks: Artworks,
  artist: Artist,
  artists: Artists,
  artistsConnection,
  authenticationStatus,
  channel,
  city: City,
  cities,
  notificationPreferences,
  // collection: Collection,
  _do_not_use_conversation: {
    ...Conversation,
    description: "Do not use (only used internally for stitching)",
  },
  bankAccount: BankAccount,
  creditCard: CreditCard,
  departments,
  // externalPartner: ExternalPartner,
  fair: Fair,
  fairOrganizer: FairOrganizer,
  fairs: Fairs,
  fairsConnection,
  feature: Feature,
  filterPartners: FilterPartners,
  // filterArtworksConnection: filterArtworksConnection(),
  external: externalField,
  gene: Gene,
  genes: Genes,
  // suggestedGenes: SuggestedGenes,
  geneFamiliesConnection: GeneFamilies,
  highlights: HighlightsField,
  homePage: HomePage,
  identityVerification: IdentityVerification,
  identityVerificationsConnection,
  job,
  jobs,
  doNotUseImageSearch: ImageSearchField,
  _do_not_use_image: {
    type: Image.type,
    resolve: Image.resolve,
    description: "Do not use (only used internally for stitching)",
  },
  // matchArtist: MatchArtist,
  // matchGene: MatchGene,
  me: Me,
  node: ObjectIdentification.NodeField,
  orderedSet: OrderedSet,
  orderedSets: OrderedSets,
  page,
  partner: Partner,
  partnerArtworks: PartnerArtworks,
  partnerCategories: PartnerCategories,
  partnerCategory: PartnerCategory,
  partnersConnection: PartnersConnection,
  phoneNumber: PhoneNumber,
  // profile: Profile,
  previewSavedSearch: PreviewSavedSearchField,
  requestLocation: RequestLocationField,
  reverseImageSearch: ReverseImageSearch,
  sale: Sale,
  saleArtwork: SaleArtwork,
  saleArtworksConnection: SaleArtworksConnectionField,
  salesConnection: SalesConnectionField,
  searchConnection: Search,
  show: Show,
  shortcut,
  showsConnection: Shows,
  staticContent: StaticContent,
  // status: Status,
  system: System,

  tag: TagField,
  targetSupply: TargetSupply,
  recentlySoldArtworks: RecentlySoldArtworks,
  // trendingArtists: TrendingArtists,
  user: UserField,
  usersConnection: Users,
  // popularArtists: PopularArtists,
  vanityURLEntity: VanityURLEntity,
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
      adminCreateFeatureFlag: createFeatureFlagMutation,
      adminUpdateFeatureFlag: updateFeatureFlagMutation,
      adminDeleteFeatureFlag: deleteFeatureFlagMutation,
      adminToggleFeatureFlag: toggleFeatureFlagMutation,
      createAccountRequest: createAccountRequestMutation,
      createBidder: createBidderMutation,
      createBidderPosition: BidderPositionMutation,
      createCreditCard: createCreditCardMutation,
      createGeminiEntryForAsset: CreateGeminiEntryForAsset,
      createIdentityVerificationOverride: createIdentityVerificationOverrideMutation,
      createUserInterest: createUserInterestMutation,
      deleteBankAccount: deleteBankAccountMutation,
      deleteCreditCard: deleteCreditCardMutation,
      deleteMyAccountMutation: deleteUserAccountMutation,
      deleteUserInterest: deleteUserInterestMutation,
      endSale: endSaleMutation,
      followArtist: FollowArtist,
      followGene: FollowGene,
      followProfile: FollowProfile,
      followShow: FollowShow,
      linkAuthentication: linkAuthenticationMutation,
      mergeArtists: mergeArtistsMutation,
      myCollectionCreateArtwork: myCollectionCreateArtworkMutation,
      myCollectionUpdateArtwork: myCollectionUpdateArtworkMutation,
      myCollectionDeleteArtwork: myCollectionDeleteArtworkMutation,
      deleteArtworkImage: DeleteArtworkImageMutation,
      requestCredentialsForAssetUpload: CreateAssetRequestLoader,
      saveArtwork: saveArtworkMutation,
      sendConfirmationEmail: sendConfirmationEmailMutation,
      sendConversationMessage: SendConversationMessageMutation,
      sendIdentityVerificationEmail: sendIdentityVerificationEmailMutation,
      submitInquiryRequestMutation,
      sendFeedback: sendFeedbackMutation,
      startIdentityVerification: startIdentityVerificationMutation,
      unlinkAuthentication: unlinkAuthenticationMutation,
      updateCollectorProfile: UpdateCollectorProfile,
      updateConversation: UpdateConversationMutation,
      updateMyPassword: updateMyPasswordMutation,
      updateUser: updateUserMutation,
      updateUserSaleProfile: updateUserSaleProfileMutation,
      updateMyUserProfile: UpdateMyUserProfileMutation,
      updateNotificationPreferences: updateNotificationPreferencesMutation,
      deleteMyUserProfileIcon: deleteCollectorProfileIconMutation,
      requestPriceEstimate: requestPriceEstimateMutation,
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
