import { GraphQLFieldConfig, GraphQLList, GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import type { TCity } from "schema/v2/city"
import { PositronArticle } from "schema/v2/cityGuideEvent/cityGuideEventArticle"
import { CityArticleType } from "./cityArticle"

export const CityArticlesField: GraphQLFieldConfig<TCity, ResolverContext> = {
  type: new GraphQLNonNull(
    new GraphQLList(new GraphQLNonNull(CityArticleType))
  ),
  description: "This city's attached editorial articles, in order.",
  resolve: async (city, _args, { cityArticlesLoader, articlesLoader }) => {
    const joins = await cityArticlesLoader({ city_slug: city.slug })
    if (joins.length === 0) return []

    const { results } = await articlesLoader({
      ids: joins.map((join) => join.article_id),
      published: true,
      limit: joins.length,
    })
    const byId = new Map<string, PositronArticle>(
      results.map((article: PositronArticle) => [article.id, article])
    )

    // Drop joins whose article Positron didn't return: either it's an unpublished draft
    // (filtered intentionally by `published: true`) or a dangling reference to a deleted
    // article. Either way, we skip it rather than erroring the whole list.
    return joins.flatMap((join) => {
      const article = byId.get(join.article_id)
      return article ? [{ ...join, article }] : []
    })
  },
}

export default CityArticlesField
