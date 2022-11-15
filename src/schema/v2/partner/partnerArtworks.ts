import { artworkConnection } from "schema/v2/artwork"
import { GraphQLString, GraphQLFieldConfig, GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { pageable } from "relay-cursor-paging"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { GraphQLBoolean } from "graphql"
import { merge } from "lodash"
import { createPageCursors } from "schema/v2/fields/pagination"

const PartnerArtworks: GraphQLFieldConfig<void, ResolverContext> = {
  type: artworkConnection.connectionType,
  description: "A list of Artworks for a partner",
  deprecationReason:
    "This is only for use in resolving stitched queries, not for first-class client use.",
  args: pageable({
    partnerID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    viewingRoomID: {
      type: GraphQLString,
    },
    private: {
      type: GraphQLBoolean,
    },
  }),
  resolve: (_root, args, { partnerArtworksLoader }) => {
    const { partnerID, viewingRoomID } = args
    const pageOptions = convertConnectionArgsToGravityArgs(args)
    const { page, size, offset } = pageOptions

    return partnerArtworksLoader(partnerID, {
      page,
      size,
      viewing_room_id: viewingRoomID,
      total_count: true,
    }).then(({ body, headers }) => {
      const totalCount = parseInt(headers["x-total-count"] || "0", 10)
      const totalPages = Math.ceil(totalCount / size)

      return merge(
        {
          pageCursors: createPageCursors(pageOptions, totalCount),
          totalCount,
        },
        connectionFromArraySlice(body, args, {
          arrayLength: totalCount,
          sliceStart: offset,
        }),
        {
          pageInfo: {
            hasPreviousPage: page > 1,
            hasNextPage: page < totalPages,
          },
        }
      )
    })
  },
}

export default PartnerArtworks
