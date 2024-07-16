import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"

// This type should match (and be called the same) as the type
// in the stitched schema. It must have the same fields and types (no new fields).
const MarketingCollectionType = new GraphQLObjectType<any, ResolverContext>({
  name: "MarketingCollection",
  fields: {
    title: {
      type: GraphQLString,
    },
    // newFieldEntirely: {
    //   type: GraphQLString,
    //   resolve: () => "this field cannot be accessed",
    // },
  },
})

export const MarketingCollection: GraphQLFieldConfig<void, ResolverContext> = {
  type: MarketingCollectionType,
  description: "A Marketing Collection",
  args: {
    slug: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: () => {
    return {
      title: "un-stitched marketing collection title",
    }
  },
}
