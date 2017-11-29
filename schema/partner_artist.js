import gravity from "lib/loaders/legacy/gravity"
import Partner from "./partner"
import Artist from "./artist/index"
import numeral from "./fields/numeral"
import { IDFields } from "./object_identification"
import { GraphQLString, GraphQLObjectType, GraphQLNonNull, GraphQLBoolean } from "graphql"
import { connectionDefinitions } from "graphql-relay"

const counts = {
  type: new GraphQLObjectType({
    name: "PartnerArtistCounts",
    fields: {
      artworks: numeral(({ published_artworks_count }) => published_artworks_count),
      for_sale_artworks: numeral(({ published_for_sale_artworks_count }) => published_for_sale_artworks_count),
    },
  }),
  resolve: partner_artist => partner_artist,
}

const fields = () => {
  return {
    ...IDFields,
    artist: {
      type: Artist.type,
    },
    biography: {
      type: GraphQLString,
    },
    counts,
    is_display_on_partner_profile: {
      type: GraphQLBoolean,
      resolve: ({ display_on_partner_profile }) => display_on_partner_profile,
    },
    is_represented_by: {
      type: GraphQLBoolean,
    },
    is_use_default_biography: {
      type: GraphQLBoolean,
    },
    partner: {
      type: Partner.type,
    },
    sortable_id: {
      type: GraphQLString,
    },
  }
}

export const PartnerArtistType = new GraphQLObjectType({
  name: "PartnerArtist",
  fields,
})

const PartnerArtist = {
  type: PartnerArtistType,
  description: "A PartnerArtist",
  args: {
    artist_id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Artist",
    },
    partner_id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Partner",
    },
  },
  resolve: (root, { partner_id, artist_id }) => gravity(`partner/${partner_id}/artist/${artist_id}`),
}

export default PartnerArtist

// export const partnerArtistConnection = connectionDefinitions({
//   nodeType: PartnerArtistType,
// }).connectionType

// export const { edgeType: PartnerArtistEdge } = connectionDefinitions({
//   nodeType: PartnerArtistType,
// }).connectionType

export const PartnerArtistConnection = connectionDefinitions({
  name: "PartnerArtistConnection",
  nodeType: PartnerArtistType,
  edgeFields: fields,
}).connectionType
