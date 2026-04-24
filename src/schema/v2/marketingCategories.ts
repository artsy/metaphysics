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
        type: new GraphQLNonNull(
          new GraphQLList(new GraphQLNonNull(MarketingCollectionType))
        ),
        resolve: ({ collections }) => collections,
      },
      name: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: ({ name }) => name,
      },
    },
  }
)

export const MarketingCategories: GraphQLFieldConfig<any, ResolverContext> = {
  type: new GraphQLNonNull(
    new GraphQLList(new GraphQLNonNull(MarketingCollectionCategory))
  ),
  description: "Marketing Categories",
  resolve: async (_root, _args, { marketingCategoriesLoader }) => {
    const body = await marketingCategoriesLoader()
    return body
  },
}
