import Bidder from "schema/v2/bidder"
import {
  GraphQLList,
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLBoolean,
} from "graphql"
import { ResolverContext } from "types/graphql"

const Bidders: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(Bidder.type),
  description: "A list of the current user’s bidder registrations",
  args: {
    saleID: {
      type: GraphQLString,
      description: "The slug or ID of a Sale",
    },
    active: {
      type: GraphQLBoolean,
      description: "Limit results to bidders in active auctions",
    },
  },
  resolve: (_root, { saleID, active }, { meBiddersLoader }) => {
    const options: any = {
      sale_id: saleID,
      active,
    }
    if (!meBiddersLoader) return null
    return meBiddersLoader(options)
  },
}

export default Bidders
