import { GraphQLBoolean, GraphQLObjectType, GraphQLList, GraphQLString } from "graphql"
import { PartnerArtistConnection } from "../partner_artist"
import { pageable, getPagingParameters } from "relay-cursor-paging"
import { connectionFromArraySlice } from "graphql-relay"
import { assign } from "lodash"

const ArtistHighlightsType = new GraphQLObjectType({
  name: "ArtistHighlights",
  fields: {
    partners: {
      type: PartnerArtistConnection,
      args: pageable({
        represented_by: {
          type: GraphQLBoolean,
        },
        partner_category: {
          type: new GraphQLList(GraphQLString),
        },
      }),
      resolve: ({ id: artist_id }, options, _request, { rootValue: { partnerArtistsLoader } }) => {
        // Convert `after` cursors to page params
        const { limit: size, offset } = getPagingParameters(options)
        // Construct an object of all the params gravity will listen to
        const { represented_by, partner_category } = options
        const gravityArgs = { total_count: true, size, offset, artist_id, represented_by, partner_category }

        return partnerArtistsLoader(gravityArgs).then(({ body, headers }) => {
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
      },
    },
  },
})

const ArtistHighlights = {
  type: ArtistHighlightsType,
  resolve: artist => artist,
}

export default ArtistHighlights
