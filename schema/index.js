// @ts-check

import Status from "./status"
import Article from "./article"
import Articles from "./articles"
import Artwork from "./artwork"
import Artworks from "./artworks"
import Artist from "./artist"
import Artists from "./artists"
import Collection from "./collection"
import ExternalPartner from "./external_partner"
import Fair from "./fair"
import Fairs from "./fairs"
import Gene from "./gene"
import GeneFamilies from "./gene_families"
import GeneFamily from "./gene_family"
import HomePage from "./home"
import OrderedSet from "./ordered_set"
import OrderedSets from "./ordered_sets"
import Profile from "./profile"
import Partner from "./partner"
import Partners from "./partners"
import FilterPartners from "./filter_partners"
import filterArtworks from "./filter_artworks"
import FilterSaleArtworks from "./filter_sale_artworks"
import FollowArtist from "./me/follow_artist"
import PartnerCategory from "./partner_category"
import PartnerCategories from "./partner_categories"
import PartnerShow from "./partner_show"
import PartnerShows from "./partner_shows"
import PopularArtists from "./artists/popular"
import Sale from "./sale/index"
import Sales from "./sales"
import SaleArtwork from "./sale_artwork"
import Search from "./search"
import Show from "./show"
import Tag from "./tag"
import TrendingArtists from "./artists/trending"
import MatchArtist from "./match/artist"
import Me from "./me"

import UpdateConversationMutation from "./me/conversation/update_mutation"
import SendConversationMessageMutation from "./me/conversation/send_message_mutation"
import MarkReadMessageMutation from "./me/conversation/mark_read_message_mutation"
import UpdateCollectorProfile from "./me/update_collector_profile"
import CreateSubmissionMutation from "./me/consignments/create_submission_mutation"
import UpdateSubmissionMutation from "./me/consignments/update_submission_mutation"
import AddAssetToConsignmentSubmission from "./me/consignments/add_asset_to_submission_mutation"
import SaveArtworkMutation from "./me/save_artwork_mutation"
import CreateAssetRequestLoader from "./asset_uploads/create_asset_request_mutation"
import CreateGeminiEntryForAsset from "./asset_uploads/finalize_asset_mutation"

import CausalityJWT from "./causality_jwt"
import ObjectIdentification from "./object_identification"
import { GraphQLSchema, GraphQLObjectType } from "graphql"

const rootFields = {
  article: Article,
  articles: Articles,
  artwork: Artwork,
  artworks: Artworks,
  artist: Artist,
  artists: Artists,
  causality_jwt: CausalityJWT,
  collection: Collection,
  external_partner: ExternalPartner,
  fair: Fair,
  fairs: Fairs,
  filter_partners: FilterPartners,
  filter_artworks: filterArtworks(),
  filter_sale_artworks: FilterSaleArtworks,
  gene: Gene,
  gene_families: GeneFamilies,
  gene_family: GeneFamily,
  home_page: HomePage,
  match_artist: MatchArtist,
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
  sales: Sales,
  search: Search,
  show: Show,
  status: Status,
  tag: Tag,
  trending_artists: TrendingArtists,
  popular_artists: PopularArtists,
}

const ViewerType = new GraphQLObjectType({
  name: "Viewer",
  description: "A wildcard used to support complex root queries in Relay",
  fields: rootFields,
})

const Viewer = {
  type: ViewerType,
  description: "A wildcard used to support complex root queries in Relay",
  resolve: x => x,
}

const schema = new GraphQLSchema({
  mutation: new GraphQLObjectType({
    name: "Mutation",
    fields: {
      followArtist: FollowArtist,
      updateCollectorProfile: UpdateCollectorProfile,
      updateConversation: UpdateConversationMutation,
      sendConversationMessage: SendConversationMessageMutation,
      markReadMessage: MarkReadMessageMutation,
      saveArtwork: SaveArtworkMutation,
      createConsignmentSubmission: CreateSubmissionMutation,
      updateConsignmentSubmission: UpdateSubmissionMutation,
      addAssetToConsignmentSubmission: AddAssetToConsignmentSubmission,
      requestCredentialsForAssetUpload: CreateAssetRequestLoader,
      createGeminiEntryForAsset: CreateGeminiEntryForAsset,
    },
  }),
  query: new GraphQLObjectType({
    name: "Query",
    fields: {
      ...rootFields,
      viewer: Viewer,
    },
  }),
})

export default schema
