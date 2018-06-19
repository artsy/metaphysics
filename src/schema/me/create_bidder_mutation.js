import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import Bidder from "schema/bidder"

export default mutationWithClientMutationId({
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
      resolve: bidder => bidder,
    },
  },
  mutateAndGetPayload: (
    { sale_id },
    request,
    { rootValue: { accessToken, createBidderLoader } }
  ) => {
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }

    return createBidderLoader({ sale_id })
  },
})
