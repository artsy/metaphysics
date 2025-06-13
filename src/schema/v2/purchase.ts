import {
  GraphQLFloat,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import type { GraphQLFieldConfig } from "graphql"
import type { ResolverContext } from "types/graphql"
import { IDFields, NodeInterface } from "./object_identification"
import { ArtworkType } from "./artwork"
import { date } from "./fields/date"
import { UserType } from "./user"
import { FairType } from "./fair"
import { SaleType } from "./sale"

export const PurchaseType = new GraphQLObjectType<any, ResolverContext>({
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
      description: "Person who found the sale",
      resolve: ({ discover_admin }) => discover_admin,
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
    ownerID: {
      type: GraphQLString,
      resolve: ({ owner_id }) => owner_id,
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
      resolve: ({ sale_admin }) => sale_admin,
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

export const Purchase: GraphQLFieldConfig<void, ResolverContext> = {
  type: PurchaseType,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the purchase",
    },
  },
  resolve: async (_root, { id }, { purchaseLoader }) => {
    if (!purchaseLoader) {
      throw new Error(
        "A X-Access-Token header is required to perform this action."
      )
    }

    return purchaseLoader(id)
  },
}
