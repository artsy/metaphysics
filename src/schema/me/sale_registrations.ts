import { first } from "lodash"
import Sale from "schema/sale/index"
import Sales from "schema/sales"
import Bidder from "schema/bidder"
import {
  GraphQLList,
  GraphQLBoolean,
  GraphQLObjectType,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const SaleRegistrationType = new GraphQLObjectType<any, ResolverContext>(
  {
    name: "SaleRegistration",
    fields: () => ({
      bidder: {
        type: Bidder.type,
      },
      is_registered: {
        type: GraphQLBoolean,
      },
      sale: {
        type: Sale.type,
      },
    }),
  }
)

const SaleRegistration: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(SaleRegistrationType),
  args: Sales.args,
  resolve: (_root, options, { meBiddersLoader, salesLoader }) => {
    if (!meBiddersLoader) return null
    return salesLoader(options).then(sales => {
      return Promise.all(
        sales.map(sale => {
          return meBiddersLoader({ sale_id: sale.id }).then(bidders => {
            return {
              sale,
              bidder: first(bidders),
              is_registered: bidders.length > 0,
            }
          })
        })
      )
    })
  },
}

export default SaleRegistration
