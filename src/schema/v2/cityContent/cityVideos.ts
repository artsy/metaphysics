import { GraphQLFieldConfig, GraphQLList, GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import type { TCity } from "schema/v2/city"
import { CityVideoType } from "./cityVideo"
import { resolveCityVideoJoins } from "./resolveCityVideoJoins"

export const CityVideosField: GraphQLFieldConfig<TCity, ResolverContext> = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(CityVideoType))),
  description: "This city's attached videos, in order.",
  resolve: async (city, _args, { cityVideosLoader }) => {
    const joins = await cityVideosLoader({ city_slug: city.slug })
    return resolveCityVideoJoins(joins)
  },
}

export default CityVideosField
