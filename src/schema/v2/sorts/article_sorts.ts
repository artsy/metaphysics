import { GraphQLEnumType } from "graphql"

export const ARTICLE_SORTS = {
  PUBLISHED_AT_ASC: {
    value: "published_at",
  },
  PUBLISHED_AT_DESC: {
    value: "-published_at",
  },
}

const ArticleSorts = {
  type: new GraphQLEnumType({
    name: "ArticleSorts",
    values: ARTICLE_SORTS,
  }),
}

export type ArticleSort = typeof ARTICLE_SORTS[keyof typeof ARTICLE_SORTS]["value"]

export default ArticleSorts
