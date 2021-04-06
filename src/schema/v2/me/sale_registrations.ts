import { first } from "lodash"
import { pageable } from "relay-cursor-paging"
import Sale from "schema/v2/sale/index"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import { SalesConnectionField } from "schema/v2/sales"
import Bidder from "schema/v2/bidder"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { BodyAndHeaders } from "lib/loaders"
import { GraphQLBoolean, GraphQLObjectType, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "schema/v2/object_identification"

export const SaleRegistrationType = new GraphQLObjectType<any, ResolverContext>(
  {
    name: "SaleRegistration",
    fields: () => ({
      ...InternalIDFields,
      bidder: {
        type: Bidder.type,
      },
      isRegistered: {
        type: GraphQLBoolean,
      },
      sale: {
        type: Sale.type,
      },
    }),
  }
)

export const SaleRegistrationConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: connectionDefinitions({ nodeType: SaleRegistrationType })
    .connectionType,
  args: pageable(SalesConnectionField.args),
  resolve: async (
    _root,
    { isAuction: is_auction, live, published, sort, ...paginationArgs },
    { meBiddersLoader, salesLoaderWithHeaders }
  ) => {
    if (!meBiddersLoader) return null
    const { page, size, offset } = convertConnectionArgsToGravityArgs(
      paginationArgs
    )
    const response: BodyAndHeaders = await salesLoaderWithHeaders({
      is_auction,
      live,
      published,
      sort,
      page,
      size,
      total_count: true,
    })
    const { body: sales, headers } = response
    const saleRegistrations = await Promise.all(
      sales.map(async (sale) => {
        const bidders = await meBiddersLoader({ sale_id: sale.id })
        return {
          sale,
          bidder: first(bidders),
          isRegistered: bidders.length > 0,
        }
      })
    )

    return connectionFromArraySlice(saleRegistrations, paginationArgs, {
      arrayLength: parseInt(headers["x-total-count"] || "0", 10),
      sliceStart: offset,
    })
  },
}
