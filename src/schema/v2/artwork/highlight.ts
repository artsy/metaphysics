import { ShowType } from "schema/v2/show"
import { ArticleType } from "schema/v2/article"
import { GraphQLUnionType } from "graphql"

export const ArtworkHighlightType = new GraphQLUnionType({
  name: "ArtworkHighlight",
  types: [ShowType, ArticleType],
  resolveType(value, _context, _info) {
    switch (value.highlight_type) {
      case "Show":
        return ShowType
      case "Sale":
      case "Article":
        return ArticleType
      default:
        throw new Error(`Unknown highlight type: ${value.highlight_type}`)
    }
  },
})
