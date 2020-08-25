import { artworkConnection } from "./artwork"
import {
  GraphQLList,
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLBoolean,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { pageable } from "relay-cursor-paging"
import { connectionFromArraySlice } from "graphql-relay"
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
    respectParamsOrder: {
      type: GraphQLBoolean,
      defaultValue: false,
    },
  }),
  resolve: (_root, options, { artworksLoader }) => {
    const { ids: allIDs, respectParamsOrder } = options
    const { page, size, offset } = convertConnectionArgsToGravityArgs(options)

    // Since `allIDs` can be a very long list, it must be truncated.
    // We have `page and `size`, and we optimistically assume all of
    // the artworks are published, so we first paginate the list of `ids`.
    const ids = allIDs.slice((page - 1) * size - 1, size)
    const totalCount = allIDs.length
    return artworksLoader({ ids, batched: respectParamsOrder }).then((body) => {
      return {
        totalCount,
        pageCursors: createPageCursors({ page, size }, totalCount),
        ...connectionFromArraySlice(body, options, {
          arrayLength: totalCount,
          sliceStart: offset,
        }),
      }
    })
  },
}

export default Artworks
