import { first } from "lodash"
import gravity from "lib/loaders/gravity"
import Sale from "schema/sale/index"
import Sales from "schema/sales"
import Bidder from "schema/bidder"
import { GraphQLList, GraphQLBoolean, GraphQLObjectType } from "graphql"

export const SaleRegistrationType = new GraphQLObjectType({
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
})

export default {
  type: new GraphQLList(SaleRegistrationType),
  args: Sales.args,
  resolve: (root, options, request, { rootValue: { accessToken } }) => {
    return gravity("sales", options).then(sales => {
      return Promise.all(
        sales.map(sale => {
          return gravity.with(accessToken)("me/bidders", { sale_id: sale.id }).then(bidders => {
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
