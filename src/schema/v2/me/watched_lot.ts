import { GraphQLObjectType } from "graphql"
import { SaleArtworkType } from "schema/v2/sale_artwork"
import { ResolverContext } from "types/graphql"
import {
  NodeInterface,
  SlugAndInternalIDFields,
} from "schema/v2/object_identification"
import { pageable } from "relay-cursor-paging"
// import { connectionWithCursorInfo } from "./fields/pagination"
import gql from "lib/gql"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { connectionFromArray, connectionFromArraySlice } from "graphql-relay"
import { connectionWithCursorInfo } from "../fields/pagination"

const WatchedLot = new GraphQLObjectType<any, ResolverContext>({
  name: "WatchedLot",
  description:
    "A lot in an auction containing merged Sale artwork and Lot state data.",
  interfaces: () => {
    return [NodeInterface]
  },
  fields: () => {
    return {
      // Must place an `id` at the root of the object (next to saleArtwork)
      // when resolving a lot for this to work (see resolver)
      ...SlugAndInternalIDFields,
      saleArtwork: {
        type: SaleArtworkType,
        description: "The watched saleArtwork object.",
        resolve: (artwork) => artwork,
      },
    }
  },
})

export const watchedLotConnection2 = {
  description: "A list of lots a user is watching.",
  type: connectionWithCursorInfo({
    nodeType: WatchedLot,
  }).connectionType,
  args: pageable(),
  resolve: async (_parent, args, { saleArtworksAllLoader }) => {
    const { first = 25, ...rest } = args

    const gravityArgs = convertConnectionArgsToGravityArgs({
      include_watched_artworks: true,
      total_count: true,
      first,
      ...rest,
    })

    delete gravityArgs.page

    const { body, headers } = await saleArtworksAllLoader(gravityArgs)

    const connection = connectionFromArraySlice(body, args, {
      arrayLength: parseInt(headers["x-total-count"] || "0", 10),
      sliceStart: gravityArgs.offset,
    })
    return connection
  },
}
