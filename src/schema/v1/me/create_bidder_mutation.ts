import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import Bidder from "schema/v1/bidder"
import { ResolverContext } from "types/graphql"

export default mutationWithClientMutationId<any, any, ResolverContext>({
  name: "CreateBidder",
  description: "Create a bidder",
  inputFields: {
    sale_id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    bidder: {
      type: Bidder.type,
      resolve: (bidder) => bidder,
    },
  },
  mutateAndGetPayload: ({ sale_id }, { createBidderLoader }) => {
    if (!createBidderLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    return createBidderLoader({ sale_id })
  },
})
