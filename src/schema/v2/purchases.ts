import type { ResolverContext } from "types/graphql"
import {
  GraphQLString,
  GraphQLFloat,
  GraphQLObjectType,
  GraphQLInt,
} from "graphql"
import type { GraphQLFieldConfig } from "graphql"
import { IDFields, NodeInterface } from "./object_identification"
import { ArtworkType } from "./artwork"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { date } from "./fields/date"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { UserType } from "./user"
import { FairType } from "./fair"
import { SaleType } from "./sale"
import { identity, pickBy } from "lodash"

const PurchaseType = new GraphQLObjectType<any, ResolverContext>({
  name: "Purchase",
  interfaces: [NodeInterface],
  fields: {
    ...IDFields,
    artsyCommission: {
      type: GraphQLFloat,
      resolve: ({ artsy_commission }) => artsy_commission,
    },
    artwork: {
      type: ArtworkType,
    },
    createdAt: date(({ created_at }) => created_at),
    discoverAdmin: {
      type: UserType,
      resolve: ({ discover_admin }) => discover_admin,
      description: "Person who found the sale",
    },
    email: {
      type: GraphQLString,
    },
    fair: {
      type: FairType,
    },
    note: {
      type: GraphQLString,
    },
    ownerType: {
      type: GraphQLString,
      resolve: ({ owner_type }) => owner_type,
    },
    sale: {
      type: SaleType,
    },
    saleAdmin: {
      type: UserType,
      description: "Person who facilitated the sale",
    },
    salePrice: {
      type: GraphQLFloat,
      resolve: ({ sale_price }) => sale_price,
    },
    saleDate: date(({ sale_date }) => sale_date),
    source: { type: GraphQLString },
    user: {
      type: UserType,
    },
  },
})

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
