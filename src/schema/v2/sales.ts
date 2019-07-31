import { clone } from "lodash"
import Sale from "./sale/index"
import SaleSorts from "./sale/sorts"
import {
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLString,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"

const Sales: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(Sale.type),
  description: "A list of Sales",
  args: {
    isAuction: {
      description: "Limit by auction.",
      type: GraphQLBoolean,
      defaultValue: true,
    },
    ids: {
      type: new GraphQLList(GraphQLString),
      description: `
        Only return sales matching specified ids.
        Accepts list of ids.
      `,
    },
    live: {
      description: "Limit by live status.",
      type: GraphQLBoolean,
      defaultValue: true,
    },
    published: {
      description: "Limit by published status.",
      type: GraphQLBoolean,
      defaultValue: true,
    },
    size: {
      type: GraphQLInt,
    },
    sort: SaleSorts,
  },
  resolve: (_root, { isAuction, ..._options }, { salesLoader }) => {
    const options: any = {
      is_auction: isAuction,
      ..._options,
    }
    const cleanedOptions = clone(options)
    // Rename ids plural to id to match Gravity
    if (options.ids) {
      cleanedOptions.id = options.ids
      delete cleanedOptions.ids
    }
    return salesLoader(cleanedOptions)
  },
}

export default Sales
