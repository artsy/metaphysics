import { artworkConnection } from "./artwork"
import {
  GraphQLList,
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLBoolean,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { pageable } from "relay-cursor-paging"
import { connectionFromArray } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { createPageCursors } from "schema/v2/fields/pagination"

const Artworks: GraphQLFieldConfig<void, ResolverContext> = {
  type: artworkConnection.connectionType,
  description: "A list of Artworks",
  deprecationReason:
    "This is only for use in resolving stitched queries, not for first-class client use.",
  args: pageable({
    ids: {
      type: new GraphQLList(GraphQLString),
    },
    respectParamsOrder: {
      type: GraphQLBoolean,
      defaultValue: false,
    },
  }),
  resolve: (_root, options, { artworksLoader }) => {
    const { ids, respectParamsOrder } = options
    const { page, size } = convertConnectionArgsToGravityArgs(options)
    return artworksLoader({ ids, batched: respectParamsOrder }).then((body) => {
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
