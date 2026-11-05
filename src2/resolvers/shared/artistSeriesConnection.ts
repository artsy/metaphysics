import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { paginationResolver } from "lib/pagination"
import { ResolverContext } from "types/graphql"

// Without `first`/`last` the page size would be undefined and the connection
// would come back with no edges, so fall back to Gravity's own default page size.
const DEFAULT_PAGE_SIZE = 10

type GravityArgs = {
  artist_id?: string
  artwork_id?: string
  exclude_ids?: string[]
}

/**
 * Fetches a page of ArtistSeries from Gravity and builds the Relay connection.
 * Shared by `Query.artistSeriesConnection` and `Artist.artistSeriesConnection`;
 * each passes the Gravity filter params that apply to it.
 */
export const resolveArtistSeriesConnection = async (
  connectionArgs,
  gravityArgs: GravityArgs,
  { artistSeriesListLoader }: ResolverContext
) => {
  const args =
    connectionArgs.first == null && connectionArgs.last == null
      ? { ...connectionArgs, first: DEFAULT_PAGE_SIZE }
      : connectionArgs
  const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

  const { body, headers } = await artistSeriesListLoader({
    page,
    size,
    total_count: true,
    ...gravityArgs,
  })

  const totalCount = parseInt(headers["x-total-count"] || "0", 10)

  return paginationResolver({ args, body, offset, page, size, totalCount })
}
