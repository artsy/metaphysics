import {
  GraphQLBoolean,
  GraphQLObjectType,
  GraphQLString,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"
import date from "./fields/date"
import { InternalIDFields } from "./object_identification"
import Sale from "./sale/index"

const BidderType = new GraphQLObjectType<any, ResolverContext>({
  name: "Bidder",
  fields: () => ({
    ...InternalIDFields,
    createdAt: date,
    pin: {
      type: GraphQLString,
    },
    qualifiedForBidding: {
      type: GraphQLBoolean,
      resolve: ({ qualified_for_bidding }) => qualified_for_bidding,
    },
    sale: {
      type: Sale.type,
    },
  }),
})

const Bidder: GraphQLFieldConfig<void, ResolverContext> = {
  type: BidderType,
}

export default Bidder
