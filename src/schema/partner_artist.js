import gravity from "lib/loaders/legacy/gravity"
import Partner from "./partner"
import Artist from "./artist/index"
import numeral from "./fields/numeral"
import { IDFields } from "./object_identification"
import { GraphQLString, GraphQLObjectType, GraphQLNonNull, GraphQLBoolean } from "graphql"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import { getPagingParameters } from "relay-cursor-paging"
import { assign } from "lodash"

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
      resolve: ({ represented_by }) => represented_by,
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

// The below can be used as the connection from an artist to its partners.
// The edge is the PartnerArtist relationship, with the node being the partner.
export const PartnerArtistConnection = connectionDefinitions({
  name: "PartnerArtist",
  edgeType: PartnerArtistType,
  nodeType: Partner.type,
  edgeFields: fields,
}).connectionType

export const partnersForArtist = (artist_id, options, loader) => {
  // Convert `after` cursors to page params
  const { limit: size, offset } = getPagingParameters(options)
  // Construct an object of all the params gravity will listen to
  const { represented_by, partner_category } = options
  const gravityArgs = { total_count: true, size, offset, artist_id, represented_by, partner_category }

  return loader(gravityArgs).then(({ body, headers }) => {
    const connection = connectionFromArraySlice(body, options, {
      arrayLength: headers["x-total-count"],
      sliceStart: offset,
    })

    // Inject the partner artist data into edges, and set the partner as the node.
    let newEdges = []
    connection.edges.forEach(edge => {
      const newEdge = assign(
        {
          ...edge.node,
        },
        {},
        edge
      )
      newEdge.node = edge.node.partner
      newEdges = newEdges.concat(newEdge)
    })
    connection.edges = newEdges

    return connection
  })
}
