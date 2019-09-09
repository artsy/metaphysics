import { create } from "lodash"
import { ShowType } from "schema/v1/show"
import { ArticleType } from "schema/v1/article"
import { GraphQLUnionType } from "graphql"

export const HighlightedShowType = create(ShowType, {
  name: "HighlightedShow",
  isTypeOf: ({ highlight_type }) => highlight_type === "Show",
})

export const HighlightedArticleType = create(ArticleType, {
  name: "HighlightedArticle",
  isTypeOf: ({ highlight_type }) => highlight_type === "Article",
})

export const HighlightType = new GraphQLUnionType({
  name: "Highlighted",
  types: [HighlightedShowType, HighlightedArticleType],
})

export default HighlightType
