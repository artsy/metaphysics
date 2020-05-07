import { GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"

// This type exists only to be extended in the kaws/stitching.ts file.
export const HomePageMarketingCollectionsModuleType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "HomePageMarketingCollectionsModule",
  fields: {
    _unusedField: {
      type: GraphQLString,
      resolve: () => null,
      deprecationReason:
        "This field only exists to satisfy the GraphQL Schema validation",
    },
  },
})

export const HomePageMarketingCollectionsModule = {
  type: HomePageMarketingCollectionsModuleType,
  resolve: (_root, obj) => obj,
}
