import { PositronArticle } from "schema/v2/cityGuideEvent/cityGuideEventArticle"
import { GravityCityArticle } from "./types"

interface ArticlesLoader {
  (params: { ids: string[]; published: boolean; limit: number }): Promise<{
    results: PositronArticle[]
  }>
}

interface CityArticlesLoader {
  (params: { city_slug: string }): Promise<GravityCityArticle[]>
}

// Shared by City.cityArticles and the three city article mutations: joins are
// batched through one Positron lookup, filtered to published articles, and
// re-matched by id. A join whose article Positron didn't return (an
// unpublished draft, or a dangling reference to a deleted article) is
// dropped rather than erroring the whole call.
export const resolveCityArticleJoins = async (
  joins: GravityCityArticle[],
  articlesLoader: ArticlesLoader
): Promise<Array<GravityCityArticle & { article: PositronArticle }>> => {
  if (joins.length === 0) return []

  const { results } = await articlesLoader({
    ids: joins.map((join) => join.article_id),
    published: true,
    limit: joins.length,
  })
  const byId = new Map<string, PositronArticle>(
    results.map((article) => [article.id, article])
  )

  return joins.flatMap((join) => {
    const article = byId.get(join.article_id)
    return article ? [{ ...join, article }] : []
  })
}

// Used by the create/update/delete mutations to return a city's full,
// current article list, rather than just the one join row they touched.
export const refreshCityArticles = async (
  citySlug: string,
  {
    cityArticlesLoader,
    articlesLoader,
  }: { cityArticlesLoader: CityArticlesLoader; articlesLoader: ArticlesLoader }
) => {
  const joins = await cityArticlesLoader({ city_slug: citySlug })
  return resolveCityArticleJoins(joins, articlesLoader)
}
