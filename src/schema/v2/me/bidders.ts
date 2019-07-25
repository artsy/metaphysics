import Bidder from "schema/v2/bidder"
import { GraphQLList, GraphQLString, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"

const Bidders: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(Bidder.type),
  description: "A list of the current user’s bidder registrations",
  args: {
    sale_id: {
      type: GraphQLString,
      description: "The slug or ID of a Sale",
    },
  },
  resolve: (_root, options, { meBiddersLoader }) => {
    if (!meBiddersLoader) return null
    return meBiddersLoader(options)
  },
}

export default Bidders
