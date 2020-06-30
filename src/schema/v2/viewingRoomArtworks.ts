import { artworkConnection } from "./artwork"
import { GraphQLString, GraphQLFieldConfig, GraphQLBoolean } from "graphql"
import { ResolverContext } from "types/graphql"
import { pageable } from "relay-cursor-paging"
import { connectionFromArray } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { createPageCursors } from "./fields/pagination"

const ViewingRoomArtworks: GraphQLFieldConfig<void, ResolverContext> = {
  type: artworkConnection.connectionType,
  description: "A list of Viewing Room artworks",
  deprecationReason:
    "This is only for use in resolving stitched queries, not for first-class client use.",
  args: pageable({
    viewingRoomID: {
      type: GraphQLString,
    },
    includeUnlisted: {
      type: GraphQLBoolean,
      defaultValue: false,
    },
  }),
  resolve: (_root, options, { viewingRoomArtworksLoader }) => {
    const { viewingRoomID, includeUnlisted } = options
    const { page, size } = convertConnectionArgsToGravityArgs(options)

    const params = { viewingRoomID, includeUnlisted: includeUnlisted }

    return viewingRoomArtworksLoader(params).then((body) => {
      const totalCount = body.length
      return {
        totalCount,
        pageCursors: createPageCursors({ page, size }, totalCount),
        ...connectionFromArray(body, options),
      }
    })
  },
}

export default ViewingRoomArtworks
