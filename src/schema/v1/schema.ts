import Status from "./status"
import Article from "./article"
import Articles from "./articles"
import Artwork from "./artwork"
import { ArtworkVersionResolver } from "./artwork_version"
import Artworks from "./artworks"
import Artist from "./artist"
import Artists from "./artists"
import Collection from "./collection"
import { CreditCard } from "./credit_card"
import ExternalPartner from "./external_partner"
import Fair from "./fair"
import Fairs from "./fairs"
import Gene from "./gene"
import Genes from "./genes"
import GeneFamilies from "./gene_families"
import GeneFamily from "./gene_family"
import HomePage from "./home"
import { City } from "./city"
import { Order } from "./ecommerce/order"
import { Orders } from "./ecommerce/orders"
import { CreateOrderWithArtworkMutation } from "./ecommerce/create_order_with_artwork_mutation"
import { CreateOfferOrderWithArtworkMutation } from "./ecommerce/create_offer_order_with_artwork_mutation"
import { SetOrderShippingMutation } from "./ecommerce/set_order_shipping_mutation"
import { SetOrderPaymentMutation } from "./ecommerce/set_order_payment_mutation"
import { SubmitOrderMutation } from "./ecommerce/submit_order_mutation"
import { SubmitOrderWithOfferMutation } from "./ecommerce/submit_order_with_offer"
import { ApproveOrderMutation } from "./ecommerce/approve_order_mutation"
import { BuyerAcceptOfferMutation } from "./ecommerce/buyer_accept_offer_mutation"
import { SellerAcceptOfferMutation } from "./ecommerce/seller_accept_offer_mutation"
import { BuyerCounterOfferMutation } from "./ecommerce/buyer_counter_offer_mutation"
import { SubmitPendingOfferMutation } from "./ecommerce/submit_pending_offer_mutation"
import { SellerCounterOfferMutation } from "./ecommerce/seller_counter_offer_mutation"
import { BuyerRejectOfferMutation } from "./ecommerce/buyer_reject_offer_mutation"
import { SellerRejectOfferMutation } from "./ecommerce/seller_reject_offer_mutation"
import { FulfillOrderAtOnceMutation } from "./ecommerce/fulfill_order_at_once_mutation"
import { ConfirmPickupMutation } from "./ecommerce/confirm_pickup_mutation"
import { RejectOrderMutation } from "./ecommerce/reject_order_mutation"
import { FixFailedPaymentMutation } from "./ecommerce/fix_failed_payment"
import OrderedSet from "./ordered_set"
import OrderedSets from "./ordered_sets"
import Profile from "./profile"
import Partner from "./partner"
import Partners from "./partners"
import FilterPartners from "./filter_partners"
import filterArtworks from "./filter_artworks"
import FilterSaleArtworks from "./filter_sale_artworks"
import FollowArtist from "./me/follow_artist"
import FollowProfile from "./me/follow_profile"
import FollowGene from "./me/follow_gene"
import FollowShow from "./me/follow_show"
import PartnerCategory from "./partner_category"
import PartnerCategories from "./partner_categories"
import PartnerShow from "./partner_show"
import PartnerShows from "./partner_shows"
import PopularArtists from "./artists/popular"
import Sale from "./sale/index"
import Sales from "./sales"
import SaleArtwork from "./sale_artwork"
import SaleArtworks from "./sale_artworks"
import { Search } from "./search"
import Services from "./services"
import Show from "./show"
import SuggestedGenes from "./suggested_genes"
import System from "./system"
import Tag from "./tag"
import TrendingArtists from "./artists/trending"
import Users from "./users"
import { User } from "./user"
import MatchArtist from "./match/artist"
import MatchGene from "./match/gene"
import Me from "./me"

import UpdateConversationMutation from "./me/conversation/update_conversation_mutation"
import SendConversationMessageMutation from "./me/conversation/send_message_mutation"
import UpdateCollectorProfile from "./me/update_collector_profile"
import SaveArtworkMutation from "./me/save_artwork_mutation"
import { endSaleMutation } from "./sale/end_sale_mutation"
import CreateAssetRequestLoader from "./asset_uploads/create_asset_request_mutation"
import CreateGeminiEntryForAsset from "./asset_uploads/finalize_asset_mutation"
import UpdateMyUserProfileMutation from "./me/update_me_mutation"
import createBidderMutation from "./me/create_bidder_mutation"
import createCreditCardMutation from "./me/create_credit_card_mutation"
import { deleteCreditCardMutation } from "./me/delete_credit_card_mutation"
import { BidderPositionMutation } from "./me/bidder_position_mutation"
import { sendFeedbackMutation } from "./sendFeedbackMutation"
import StaticContent from "./static_content"

import CausalityJWT from "./causality_jwt"
import ObjectIdentification from "./object_identification"
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLFieldConfigMap,
  GraphQLDirective,
  DirectiveLocation,
  specifiedDirectives,
} from "graphql"
import { ResolverContext } from "types/graphql"

import { BuyOrderType, OfferOrderType } from "./ecommerce/types/order"
import { AddInitialOfferToOrderMutation } from "./ecommerce/add_initial_offer_to_order_mutation"
import { SearchableItem } from "./SearchableItem"
import ArtworkAttributionClasses from "./artworkAttributionClasses"
import { ArtistArtworkGridType } from "./artwork/artworkContextGrids/ArtistArtworkGrid"
import { AuctionArtworkGridType } from "./artwork/artworkContextGrids/AuctionArtworkGrid"
import { PartnerArtworkGridType } from "./artwork/artworkContextGrids/PartnerArtworkGrid"
import { RelatedArtworkGridType } from "./artwork/artworkContextGrids/RelatedArtworkGrid"
import { ShowArtworkGridType } from "./artwork/artworkContextGrids/ShowArtworkGrid"

const rootFields: GraphQLFieldConfigMap<any, ResolverContext> = {
  artworkAttributionClasses: ArtworkAttributionClasses,
  article: Article,
  articles: Articles,
  artwork: Artwork,
  artworkVersion: ArtworkVersionResolver,
  artworks: Artworks,
  artist: Artist,
  artists: Artists,
  causality_jwt: CausalityJWT,
  city: City,
  collection: Collection,
  credit_card: CreditCard,
  external_partner: ExternalPartner,
  fair: Fair,
  fairs: Fairs,
  filter_partners: FilterPartners,
  // FIXME: Expected 1 arguments, but got 0
  // @ts-ignore
  filter_artworks: filterArtworks(),
  filter_sale_artworks: FilterSaleArtworks,
  gene: Gene,
  genes: Genes,
  suggested_genes: SuggestedGenes,
  gene_families: GeneFamilies,
  gene_family: GeneFamily,
  home_page: HomePage,
  match_artist: MatchArtist,
  match_gene: MatchGene,
  me: Me,
  node: ObjectIdentification.NodeField,
  ordered_set: OrderedSet,
  ordered_sets: OrderedSets,
  partner: Partner,
  partner_categories: PartnerCategories,
  partner_category: PartnerCategory,
  partner_show: PartnerShow,
  partner_shows: PartnerShows,
  partners: Partners,
  profile: Profile,
  sale: Sale,
  sale_artwork: SaleArtwork,
  sale_artworks: SaleArtworks,
  sales: Sales,
  search: Search,
  services: Services,
  show: Show,
  status: Status,
  staticContent: StaticContent,
  system: System,
  tag: Tag,
  trending_artists: TrendingArtists,
  user: User,
  users: Users,
  popular_artists: PopularArtists,
}

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

// A set of fields which are overridden when coming in from stitching
const stitchedRootFields: any = {}

// If you're using stitching then we _don't_ want to include particular mutations
// which come from the stitching instead of our manual version
const stitchedMutations: any = {}

stitchedRootFields.ecommerceOrder = Order
stitchedRootFields.ecommerceOrders = Orders

stitchedMutations.ecommerceCreateOrderWithArtwork = CreateOrderWithArtworkMutation
stitchedMutations.ecommerceCreateOfferOrderWithArtwork = CreateOfferOrderWithArtworkMutation
stitchedMutations.ecommerceSetOrderShipping = SetOrderShippingMutation
stitchedMutations.ecommerceSetOrderPayment = SetOrderPaymentMutation
stitchedMutations.ecommerceApproveOrder = ApproveOrderMutation
stitchedMutations.ecommerceBuyerAcceptOffer = BuyerAcceptOfferMutation
stitchedMutations.ecommerceSellerAcceptOffer = SellerAcceptOfferMutation
stitchedMutations.ecommerceBuyerCounterOffer = BuyerCounterOfferMutation
stitchedMutations.ecommerceSubmitPendingOffer = SubmitPendingOfferMutation
stitchedMutations.ecommerceSellerCounterOffer = SellerCounterOfferMutation
stitchedMutations.ecommerceBuyerRejectOffer = BuyerRejectOfferMutation
stitchedMutations.ecommerceSellerRejectOffer = SellerRejectOfferMutation
stitchedMutations.ecommerceConfirmPickup = ConfirmPickupMutation
stitchedMutations.ecommerceFulfillOrderAtOnce = FulfillOrderAtOnceMutation
stitchedMutations.ecommerceRejectOrder = RejectOrderMutation
stitchedMutations.ecommerceSubmitOrder = SubmitOrderMutation
stitchedMutations.ecommerceAddInitialOfferToOrder = AddInitialOfferToOrderMutation
stitchedMutations.ecommerceSubmitOrderWithOffer = SubmitOrderWithOfferMutation
stitchedMutations.ecommerceFixFailedPayment = FixFailedPaymentMutation

// Deprecated
stitchedRootFields.order = Order
stitchedRootFields.orders = Orders

// Deprecated
stitchedMutations.createOrderWithArtwork = CreateOrderWithArtworkMutation
stitchedMutations.setOrderShipping = SetOrderShippingMutation
stitchedMutations.setOrderPayment = SetOrderPaymentMutation
stitchedMutations.approveOrder = ApproveOrderMutation
stitchedMutations.fulfillOrderAtOnce = FulfillOrderAtOnceMutation
stitchedMutations.rejectOrder = RejectOrderMutation
stitchedMutations.submitOrder = SubmitOrderMutation

const PrincipalFieldDirective = new GraphQLDirective({
  name: "principalField",
  locations: [DirectiveLocation.FIELD],
})

export default new GraphQLSchema({
  allowedLegacyNames: ["__id"],
  mutation: new GraphQLObjectType<any, ResolverContext>({
    name: "Mutation",
    fields: {
      createBidder: createBidderMutation,
      createBidderPosition: BidderPositionMutation,
      createCreditCard: createCreditCardMutation,
      deleteCreditCard: deleteCreditCardMutation,
      followArtist: FollowArtist,
      followProfile: FollowProfile,
      followGene: FollowGene,
      followShow: FollowShow,
      updateCollectorProfile: UpdateCollectorProfile,
      updateMyUserProfile: UpdateMyUserProfileMutation,
      updateConversation: UpdateConversationMutation,
      sendConversationMessage: SendConversationMessageMutation,
      sendFeedback: sendFeedbackMutation,
      saveArtwork: SaveArtworkMutation,
      endSale: endSaleMutation,
      requestCredentialsForAssetUpload: CreateAssetRequestLoader,
      createGeminiEntryForAsset: CreateGeminiEntryForAsset,
      ...stitchedMutations,
    },
  }),
  query: new GraphQLObjectType<any, ResolverContext>({
    name: "Query",
    fields: {
      ...rootFields,
      ...stitchedRootFields,
      viewer: Viewer,
    },
  }),
  // These are for orphaned types which are types which should be in the schema,
  // but can’t be discovered by traversing the types and fields from query.
  //
  // In this case, the interface "Offer" is exposed everywhere, but the underlaying type BuyOrder needs to exist
  types: [
    BuyOrderType,
    OfferOrderType,
    SearchableItem,
    ArtistArtworkGridType,
    AuctionArtworkGridType,
    PartnerArtworkGridType,
    RelatedArtworkGridType,
    ShowArtworkGridType,
  ],
  directives: specifiedDirectives.concat([PrincipalFieldDirective]),
})
