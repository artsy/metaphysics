import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLDirective,
  DirectiveLocation,
  specifiedDirectives,
} from "graphql"

import Artwork from "./artwork"
import ArtworkAttributionClasses from "./artworkAttributionClasses"
import Artist from "./artist"
import Fair from "./fair"
import Gene from "./gene"
import Partner from "./partner"
import HomePage from "./home"
import StaticContent from "./static_content"
import { City } from "./city"
import { cities } from "./cities"
import FollowArtist from "./me/follow_artist"
import FollowProfile from "./me/follow_profile"
import FollowGene from "./me/follow_gene"
import FollowShow from "./me/follow_show"
import Sale from "./sale/index"
import { SalesConnectionField } from "./sales"
import { Search } from "./search"
import Show from "./show"
import Me from "./me"
import System from "./system"

// import Status from "./status"
import Article from "./article"
import Artists, { artistsConnection } from "./artists"
// import Collection from "./collection"
import { CreditCard } from "./credit_card"
// import ExternalPartner from "./external_partner"
// import Fairs from "./fairs"
import Genes from "./genes"
import GeneFamilies from "./gene_families"
import { OrderedSet } from "./OrderedSet"
import OrderedSets from "./ordered_sets"
// import Profile from "./profile"
// import Partner from "./partner"
import { PartnersConnection } from "./partners"
// import FilterPartners from "./filter_partners"
import { filterArtworksConnection } from "./filterArtworksConnection"
// import PartnerCategory from "./partner_category"
// import PartnerCategories from "./partner_categories"
// import SuggestedGenes from "./suggested_genes"
import { TagField } from "./tag"
// import TrendingArtists from "./artists/trending"
import { Users } from "./users"
import { UserField } from "./user"
// import MatchGene from "./match/gene"
// import SaleArtwork from "./sale_artwork"
// import MatchArtist from "./match/artist"
// import { SaleArtworksConnectionField } from "./sale_artworks"

import Conversation from "./me/conversation"
import UpdateConversationMutation from "./me/conversation/update_conversation_mutation"
import SendConversationMessageMutation from "./me/conversation/send_message_mutation"
import { submitInquiryRequestMutation } from "./me/conversation/submit_inquiry_request_mutation"
import UpdateCollectorProfile from "./me/update_collector_profile"
import saveArtworkMutation from "./me/saveArtworkMutation"
import { myCollectionCreateArtworkMutation } from "./me/myCollectionCreateArtworkMutation"
import { myCollectionUpdateArtworkMutation } from "./me/myCollectionUpdateArtworkMutation"
import { endSaleMutation } from "./sale/end_sale_mutation"
import CreateAssetRequestLoader from "./asset_uploads/create_asset_request_mutation"
import CreateGeminiEntryForAsset from "./asset_uploads/finalize_asset_mutation"
import UpdateMyUserProfileMutation from "./me/update_me_mutation"
import createBidderMutation from "./me/create_bidder_mutation"
import createCreditCardMutation from "./me/create_credit_card_mutation"
import { deleteCreditCardMutation } from "./me/delete_credit_card_mutation"
import { BidderPositionMutation } from "./me/bidder_position_mutation"
import { sendConfirmationEmailMutation } from "./me/sendConfirmationEmailMutation"
import { sendFeedbackMutation } from "./sendFeedbackMutation"
import { OrderPartyUnionType } from "./ecommerce/types/order_party_union"
import { createAccountRequestMutation } from "./createAccountRequestMutation"

import { SearchableItem } from "./SearchableItem"
import { ArtistArtworkGridType } from "./artwork/artworkContextGrids/ArtistArtworkGrid"
import { AuctionArtworkGridType } from "./artwork/artworkContextGrids/AuctionArtworkGrid"
import { PartnerArtworkGridType } from "./artwork/artworkContextGrids/PartnerArtworkGrid"
import { RelatedArtworkGridType } from "./artwork/artworkContextGrids/RelatedArtworkGrid"
import { ShowArtworkGridType } from "./artwork/artworkContextGrids/ShowArtworkGrid"

import ObjectIdentification from "./object_identification"
import { ResolverContext } from "types/graphql"
import { ArtworkVersionType } from "./artwork_version"
import { HighlightsField } from "./Highlights"
import { startIdentityVerificationMutation } from "./startIdentityVerificationMutation"
import Fairs, { fairsConnection } from "./fairs"
import { Feature } from "./Feature"
import Articles from "./articles"
import SaleArtwork from "./sale_artwork"
import { SaleArtworksConnectionField } from "./sale_artworks"
import Artworks from "./artworks"
import { TargetSupply } from "./TargetSupply"
import { Shows } from "./shows"
import PartnerArtworks from "./partnerArtworks"
import Image from "./image"
import VanityURLEntity from "./vanityURLEntity"
import { myCollectionDeleteArtworkMutation } from "./me/myCollectionDeleteArtworkMutation"
import { DeleteArtworkImageMutation } from "./deleteArtworkImageMutation"

import { ArtworkOrEditionSetType } from "schema/v2/artworkOrEditionSet"
import { AuctionResult } from "./auction_result"
import ArtworkMediums from "./artworkMediums"
import { RequestLocationField } from "./requestLocation"

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
