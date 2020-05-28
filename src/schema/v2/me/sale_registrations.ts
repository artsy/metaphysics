import { first } from "lodash"
import Sale from "schema/v2/sale/index"
import { SalesConnectionField } from "schema/v2/sales"
import Bidder from "schema/v2/bidder"
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
      isRegistered: {
        type: GraphQLBoolean,
        resolve: ({ is_registered }) => is_registered,
      },
      sale: {
        type: Sale.type,
      },
    }),
  }
)

// TODO: If this is needed by Reaction, it should become a connection
const SaleRegistration: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(SaleRegistrationType),
  args: SalesConnectionField.args,
  resolve: (_root, options, { meBiddersLoader, salesLoader }) => {
    if (!meBiddersLoader) return null
    return salesLoader(options).then((sales) => {
      return Promise.all(
        sales.map((sale) => {
          return meBiddersLoader({ sale_id: sale.id }).then((bidders) => {
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
