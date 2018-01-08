import Bidder from "schema/bidder"
import { GraphQLList, GraphQLString } from "graphql"

export default {
  type: new GraphQLList(Bidder.type),
  description: "A list of the current user’s bidder registrations",
  args: {
    sale_id: {
      type: GraphQLString,
      description: "The slug or ID of a Sale",
    },
  },
  resolve: (root, options, request, { rootValue: { meBiddersLoader } }) => {
    if (!meBiddersLoader) return null
    return meBiddersLoader(options)
  },
}
