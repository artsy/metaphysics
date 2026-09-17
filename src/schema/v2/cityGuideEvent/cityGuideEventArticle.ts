import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { GlobalIDField } from "schema/v2/object_identification"
import { ArticleType } from "schema/v2/article"
import { GravityCityGuideEventArticle } from "./types"

interface CityGuideEventArticleProps extends GravityCityGuideEventArticle {
  article: any
}

// A join row (an article attached to a city guide event), not the article itself.
// internalID here is the attachment's own id, needed to reorder or detach it later.
export const CityGuideEventArticleType = new GraphQLObjectType<
  CityGuideEventArticleProps,
  ResolverContext
>({
  name: "CityGuideEventArticle",
  fields: () => ({
    id: GlobalIDField,
    internalID: {
      description: "The attachment's own UUID, not the article's",
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ id }) => id,
    },
    position: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ position }) => position,
    },
    article: {
      type: new GraphQLNonNull(ArticleType),
      resolve: ({ article }) => article,
    },
  }),
})
