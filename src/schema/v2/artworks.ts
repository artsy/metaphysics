import { artworkConnection } from "./artwork"
import {
  GraphQLList,
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLBoolean,
  GraphQLNonNull,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { pageable } from "relay-cursor-paging"
import { connectionFromArray } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { createPageCursors } from "./fields/pagination"

const Artworks: GraphQLFieldConfig<void, ResolverContext> = {
  type: artworkConnection.connectionType,
  description: "A list of Artworks",
  deprecationReason:
    "This is only for use in resolving stitched queries, not for first-class client use.",
  args: pageable({
    ids: {
      type: new GraphQLList(GraphQLString),
    },
    includeUnlisted: {
      type: new GraphQLNonNull(GraphQLBoolean),
      defaultValue: false,
    },
  }),
  resolve: (_root, options, { artworksLoader }) => {
    const { ids, includeUnlisted } = options
    const params = includeUnlisted ? { ids, include_unlisted: true } : { ids }
    const { page, size } = convertConnectionArgsToGravityArgs(options)

    return artworksLoader(params).then((body) => {
      const totalCount = body.length
      return {
        totalCount,
        pageCursors: createPageCursors({ page, size }, totalCount),
        ...connectionFromArray(body, options),
      }
    })
  },
}

export default Artworks
