// @ts-check
import { clone } from "lodash"
import Sale from "./sale/index"
import SaleSorts from "./sale/sorts"
import { GraphQLList, GraphQLInt, GraphQLBoolean, GraphQLString } from "graphql"

const Sales = {
  type: new GraphQLList(Sale.type),
  description: "A list of Sales",
  args: {
    is_auction: {
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
  resolve: (_root, options, _request, { rootValue: { salesLoader } }) => {
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
