import type { ResolverContext } from "types/graphql"
import { GraphQLString, GraphQLInt } from "graphql"
import type { GraphQLFieldConfig } from "graphql"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { identity, pickBy } from "lodash"
import { PurchaseType } from "./purchase"

export const PurchasesConnection: GraphQLFieldConfig<void, ResolverContext> = {
  type: connectionWithCursorInfo({
    name: "Purchases",
    nodeType: PurchaseType,
  }).connectionType,
  description: "A list of purchases made by users.",
  args: pageable({
    artistId: {
      type: GraphQLString,
      description: "The ID or slug of the artist to filter purchases by.",
    },
    artworkId: {
      type: GraphQLString,
      description: "The ID or slug of the artwork to filter purchases by.",
    },
    saleId: {
      type: GraphQLString,
      description: "The ID of the sale to filter purchases by.",
    },
    size: { type: GraphQLInt },
    page: { type: GraphQLInt },
    userId: {
      type: GraphQLString,
      description: "The ID of the user to filter purchases by.",
    },
  }),
  resolve: async (_, args, { purchasesLoader }) => {
    if (!purchasesLoader) {
      throw new Error(
        "A X-Access-Token header is required to perform this action."
      )
    }

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    // Removes falsey values from arguments
    const gravityArgs = pickBy(
      {
        artwork_id: args.artworkId,
        artist_id: args.artistId,
        sale_id: args.saleId,
        user_id: args.userId,
        page,
        size,
        total_count: true,
      },
      identity
    )

    const { body, headers } = await purchasesLoader(gravityArgs)
    const totalCount = Number.parseInt(headers["x-total-count"] || "0", 10)

    return paginationResolver({
      args,
      body,
      offset,
      page,
      size,
      totalCount,
    })
  },
}
