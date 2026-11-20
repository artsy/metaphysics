import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { createPageCursors } from "schema/v2/fields/pagination"

// options are connection related arguments
// params are params passed into gravity to scope the results
const followArtistsResolver = async (params, connectionOptions, config) => {
  if (!config.followedArtistsLoader) return null

  const { page, size, offset } = convertConnectionArgsToGravityArgs(
    connectionOptions
  )

  const gravityArgs = {
    size,
    page,
    total_count: true,
    ...params,
  }

  const { body, headers } = await config.followedArtistsLoader(gravityArgs)

  const totalCount = parseInt(headers["x-total-count"] || "0", 10)

  return {
    totalCount,
    pageCursors: createPageCursors({ page, size }, totalCount),
    ...connectionFromArraySlice(body, connectionOptions, {
      arrayLength: totalCount,
      sliceStart: offset,
    }),
  }
}

export default followArtistsResolver
