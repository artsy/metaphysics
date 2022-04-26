import Sale from "schema/v2/sale"
import { GraphQLList, GraphQLObjectType, GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"

export const HomePageSalesModuleType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "HomePageSalesModule",
  fields: {
    results: {
      type: new GraphQLNonNull(new GraphQLList(Sale.type)),
      resolve: (_root, _options, { salesLoader }) => {
        // Check for all sales that are currently running
        const gravityOptions = {
          live: true,
          is_auction: true,
          size: 10,
          sort: "-is_artsy_licensed,timely_at,name",
        }
        return salesLoader(gravityOptions)
      },
    },
  },
})

const HomePageSalesModule = {
  type: HomePageSalesModuleType,
  resolve: (_root, obj) => obj,
}

export default HomePageSalesModule
