import { GraphQLBoolean, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"

export const listingOptions = {
  description: "In CMS, has the artwork been marked as BNMO?",
  type: new GraphQLObjectType<any, ResolverContext>({
    name: "ArtworkListingOptions",
    fields: {
      isBuyNow: {
        type: GraphQLBoolean,
        resolve: ({ ecommerce }) => !!ecommerce,
      },
      isMakeOffer: {
        type: GraphQLBoolean,
        resolve: ({ offer }) => !!offer,
      },
    },
  }),
  resolve: (artwork) => artwork,
}
