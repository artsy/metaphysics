import { GraphQLFieldConfig, GraphQLList, GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import type { TCity } from "schema/v2/city"
import { CityArticleType } from "./cityArticle"
import { resolveCityArticleJoins } from "./resolveCityArticleJoins"

export const CityArticlesField: GraphQLFieldConfig<TCity, ResolverContext> = {
  type: new GraphQLNonNull(
    new GraphQLList(new GraphQLNonNull(CityArticleType))
  ),
  description: "This city's attached editorial articles, in order.",
  resolve: async (city, _args, { cityArticlesLoader, articlesLoader }) => {
    const joins = await cityArticlesLoader({ city_slug: city.slug })
    return resolveCityArticleJoins(joins, articlesLoader)
  },
}

export default CityArticlesField
