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
import { City } from "./city"
import { createAccountRequestMutation } from "./createAccountRequestMutation"
// import Collection from "./collection"
import { CreditCard } from "./credit_card"
import { DeleteArtworkImageMutation } from "./deleteArtworkImageMutation"
import { OrderPartyUnionType } from "./ecommerce/types/order_party_union"
import Fair from "./fair"
import Fairs, { fairsConnection } from "./fairs"
import { Feature } from "./Feature"
// import FilterPartners from "./filter_partners"
import { filterArtworksConnection } from "./filterArtworksConnection"
import Gene from "./gene"
// import ExternalPartner from "./external_partner"
// import Fairs from "./fairs"
import Genes from "./genes"
import GeneFamilies from "./gene_families"
import { HighlightsField } from "./Highlights"
import HomePage from "./home"
import Image from "./image"
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
import ObjectIdentification from "./object_identification"
import { OrderedSet } from "./OrderedSet"
import OrderedSets from "./ordered_sets"
import Partner from "./partner"
import PartnerArtworks from "./partnerArtworks"
// import Profile from "./profile"
// import Partner from "./partner"
import { PartnersConnection } from "./partners"
import { RequestLocationField } from "./requestLocation"
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
// import PartnerCategory from "./partner_category"
// import PartnerCategories from "./partner_categories"
// import SuggestedGenes from "./suggested_genes"
import { TagField } from "./tag"
import { TargetSupply } from "./TargetSupply"
import { UserField } from "./user"
// import TrendingArtists from "./artists/trending"
import { Users } from "./users"
import VanityURLEntity from "./vanityURLEntity"

const PrincipalFieldDirective = new GraphQLDirective({
  name: "principalField",
  locations: [DirectiveLocation.FIELD],
})

const rootFields = {
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
  city: City,
  cities,
  // collection: Collection,
  _do_not_use_conversation: {
    ...Conversation,
    description: "Do not use (only used internally for stitching)",
  },
  creditCard: CreditCard,
  // externalPartner: ExternalPartner,
  fair: Fair,
  fairs: Fairs,
  fairsConnection,
  feature: Feature,
  // filterPartners: FilterPartners,
  // filterArtworksConnection: filterArtworksConnection(),
  gene: Gene,
  genes: Genes,
  // suggestedGenes: SuggestedGenes,
  geneFamiliesConnection: GeneFamilies,
  highlights: HighlightsField,
  homePage: HomePage,
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
  partner: Partner,
  partnerArtworks: PartnerArtworks,
  // partnerCategories: PartnerCategories,
  // partnerCategory: PartnerCategory,
  partnersConnection: PartnersConnection,
  // profile: Profile,
  requestLocation: RequestLocationField,
  sale: Sale,
  saleArtwork: SaleArtwork,
  saleArtworksConnection: SaleArtworksConnectionField,
  salesConnection: SalesConnectionField,
  searchConnection: Search,
  show: Show,
  showsConnection: Shows,
  staticContent: StaticContent,
  // status: Status,
  system: System,

  tag: TagField,
  targetSupply: TargetSupply,
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
      createAccountRequest: createAccountRequestMutation,
      createBidder: createBidderMutation,
      createBidderPosition: BidderPositionMutation,
      createCreditCard: createCreditCardMutation,
      createGeminiEntryForAsset: CreateGeminiEntryForAsset,
      deleteCreditCard: deleteCreditCardMutation,
      endSale: endSaleMutation,
      followArtist: FollowArtist,
      followGene: FollowGene,
      followProfile: FollowProfile,
      followShow: FollowShow,
      myCollectionCreateArtwork: myCollectionCreateArtworkMutation,
      myCollectionUpdateArtwork: myCollectionUpdateArtworkMutation,
      myCollectionDeleteArtwork: myCollectionDeleteArtworkMutation,
      deleteArtworkImage: DeleteArtworkImageMutation,
      requestCredentialsForAssetUpload: CreateAssetRequestLoader,
      saveArtwork: saveArtworkMutation,
      sendConfirmationEmail: sendConfirmationEmailMutation,
      sendConversationMessage: SendConversationMessageMutation,
      submitInquiryRequestMutation,
      sendFeedback: sendFeedbackMutation,
      startIdentityVerification: startIdentityVerificationMutation,
      updateCollectorProfile: UpdateCollectorProfile,
      updateConversation: UpdateConversationMutation,
      updateMyUserProfile: UpdateMyUserProfileMutation,
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
    SearchableItem,
    ArtistArtworkGridType,
    AuctionArtworkGridType,
    PartnerArtworkGridType,
    RelatedArtworkGridType,
    ShowArtworkGridType,
    ArtworkOrEditionSetType,
  ],
  directives: specifiedDirectives.concat([PrincipalFieldDirective]),
})
