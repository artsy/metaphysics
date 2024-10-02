import { GraphQLObjectType, GraphQLString } from "graphql"
import { MarketingCollectionType } from "schema/v2/marketingCollections"
import { ResolverContext } from "types/graphql"

export const ArticleSectionCollection = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArticleSectionCollection",
  isTypeOf: (data) => {
    return data.type === "collection"
  },
  fields: () => ({
    slug: { type: GraphQLString },
    collection: {
      type: MarketingCollectionType,
      resolve: ({ slug }, _options, { marketingCollectionLoader }) => {
        return marketingCollectionLoader(slug)
      },
    },
  }),
})
