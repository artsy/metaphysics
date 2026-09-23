import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { GlobalIDField } from "schema/v2/object_identification"
import { ArticleType } from "schema/v2/article"
import { PositronArticle } from "schema/v2/article/types"
import { GravityCityArticle } from "./types"

export interface CityArticleProps extends GravityCityArticle {
  article: PositronArticle
}

// A join row (an article attached to a city), not the article itself.
// internalID here is the attachment's own id, needed to reorder or detach it later.
export const CityArticleType = new GraphQLObjectType<
  CityArticleProps,
  ResolverContext
>({
  name: "CityArticle",
  fields: () => ({
    id: GlobalIDField,
    internalID: {
      description: "The attachment's own UUID, not the article's",
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ id }) => id,
    },
    citySlug: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ city_slug }) => city_slug,
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
