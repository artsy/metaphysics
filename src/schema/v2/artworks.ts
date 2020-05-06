import { artworkConnection } from "./artwork"
import {
  GraphQLList,
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLNonNull,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { pageable } from "relay-cursor-paging"
import { connectionFromArray } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { createPageCursors } from "./fields/pagination"

const Artworks: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLNonNull(artworkConnection.connectionType),
  description: "A list of Artworks",
  deprecationReason:
    "This is only for use in resolving stitched queries, not for first-class client use.",
  args: pageable({
    ids: {
      type: new GraphQLList(GraphQLString),
    },
  }),
  resolve: (_root, options, { artworksLoader }) => {
    const { ids } = options
    const { page, size } = convertConnectionArgsToGravityArgs(options)
    return artworksLoader({ ids }).then(body => {
      return {
        totalCount: ids.length,
        pageCursors: createPageCursors({ page, size }, ids.length),
        ...connectionFromArray(body, options),
      }
    })
  },
}

export default Artworks
