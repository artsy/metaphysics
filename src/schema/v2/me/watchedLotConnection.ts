import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { connectionFromArraySlice } from "graphql-relay"
import { connectionWithCursorInfo } from "../fields/pagination"
import { Lot } from "../lot"
import { GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"

export const WatchedLotConnection: GraphQLFieldConfig<void, ResolverContext> = {
  description: "A list of lots a user is watching.",
  type: connectionWithCursorInfo({
    nodeType: Lot,
  }).connectionType,
  args: pageable(),
  resolve: async (_parent, args, { saleArtworksAllLoader, userID }) => {
    if (!saleArtworksAllLoader) {
      return null
    }

    const { first = 25, ...rest } = args

    const gravityArgs = convertConnectionArgsToGravityArgs({
      include_watched_artworks: true,
      total_count: true,
      first,
      ...rest,
      ...(userID && { user_id: userID }),
    })

    // @ts-expect-error FIXME: Make `page` is an optional param of `gravityOptions`
    delete gravityArgs.page

    const { body, headers } = await saleArtworksAllLoader(gravityArgs)

    // TODO: Move this property to gravity JSON response
    body.forEach((saleArtwork) => {
      saleArtwork.isWatching = true
      return saleArtwork
    })

    const connection = connectionFromArraySlice(body, args, {
      arrayLength: parseInt(headers["x-total-count"] || "0", 10),
      sliceStart: gravityArgs.offset,
    })

    return connection
  },
}
