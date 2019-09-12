import {
  GraphQLBoolean,
  GraphQLObjectType,
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLNonNull,
} from "graphql"
import { ResolverContext } from "types/graphql"
import date from "./fields/date"
import { InternalIDFields } from "./object_identification"
import Sale from "./sale/index"
import { User } from "./user"

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
    user: {
      type: User.type,
      resolve: ({ user }, _, { userByIDLoader }) => userByIDLoader(user.id),
    },
    sale: {
      type: Sale.type,
      resolve: ({ sale }, _, { saleLoader }) => saleLoader(sale.id),
    },
  }),
})

const Bidder: GraphQLFieldConfig<void, ResolverContext> = {
  type: BidderType,
  description: "A Bidder",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the bidder",
    },
  },
  resolve: (_root, { id }, { bidderLoader }) => bidderLoader(id),
}

export default Bidder
