import { create } from "lodash"
import { ShowType } from "schema/show"
import { ArticleType } from "schema/article"
import { GraphQLUnionType, GraphQLFieldConfig, GraphQLList } from "graphql"
import { ResolverContext } from "types/graphql"
import { enhance } from "lib/helpers"
import { deprecate } from "lib/deprecation"

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

export const HighlightsField: GraphQLFieldConfig<any, ResolverContext> = {
  type: new GraphQLList(HighlightType),
  description: "Returns the highlighted shows and articles",
  deprecationReason: deprecate({
    inVersion: 2,
    preferUsageOf: "v2_highlights",
  }),
  resolve: ({ id, _id }, _options, { relatedShowsLoader, articlesLoader }) =>
    Promise.all([
      relatedShowsLoader({
        artwork: [id],
        size: 1,
        at_a_fair: false,
      }),
      articlesLoader({
        artwork_id: _id,
        published: true,
        limit: 1,
      }).then(({ results }) => results),
    ]).then(([{ body: shows }, articles]) => {
      const highlightedShows = enhance(shows, { highlight_type: "Show" })
      const highlightedArticles = enhance(articles, {
        highlight_type: "Article",
      })
      return highlightedShows.concat(highlightedArticles)
    }),
}

export const ArtworkHighlightType = new GraphQLUnionType({
  name: "ArtworkHighlight",
  types: [ShowType, ArticleType],
  resolveType: (value, _context, _info) => {
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

export const ArtworkHighlightsField: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  ...HighlightsField,
  deprecationReason: undefined,
  type: new GraphQLList(ArtworkHighlightType),
}
