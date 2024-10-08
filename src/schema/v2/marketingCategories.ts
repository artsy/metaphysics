import {
  GraphQLList,
  GraphQLString,
  GraphQLObjectType,
  GraphQLFieldConfig,
  GraphQLNonNull,
} from "graphql"
import { MarketingCollectionType } from "./marketingCollections"
import { ResolverContext } from "types/graphql"

const MarketingCollectionCategory = new GraphQLObjectType<any, ResolverContext>(
  {
    name: "MarketingCollectionCategory",
    fields: {
      collections: {
        type: GraphQLNonNull(
          new GraphQLList(GraphQLNonNull(MarketingCollectionType))
        ),
        resolve: ({ collections }) => collections,
      },
      name: {
        type: GraphQLNonNull(GraphQLString),
        resolve: ({ name }) => name,
      },
    },
  }
)

export const MarketingCategories: GraphQLFieldConfig<any, ResolverContext> = {
  type: GraphQLNonNull(
    GraphQLList(GraphQLNonNull(MarketingCollectionCategory))
  ),
  description: "Marketing Categories",
  resolve: async (_root, _args, { marketingCategoriesLoader }) => {
    const body = await marketingCategoriesLoader()
    return body
  },
}
