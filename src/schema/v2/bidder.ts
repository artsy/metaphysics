import {
  GraphQLBoolean,
  GraphQLObjectType,
  GraphQLString,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"
import date from "./fields/date"
import { IDFields } from "./object_identification"
import Sale from "./sale/index"

const BidderType = new GraphQLObjectType<any, ResolverContext>({
  name: "Bidder",
  fields: () => ({
    ...IDFields,
    created_at: date,
    pin: {
      type: GraphQLString,
    },
    qualified_for_bidding: {
      type: GraphQLBoolean,
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
