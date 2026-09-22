import { GraphQLFieldConfig, GraphQLList, GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import type { TCity } from "schema/v2/city"
import { CityVideoType } from "./cityVideo"

export const CityVideosField: GraphQLFieldConfig<TCity, ResolverContext> = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(CityVideoType))),
  description: "This city's attached videos, in order.",
  resolve: (city, _args, { cityVideosLoader }) => {
    return cityVideosLoader({ city_slug: city.slug })
  },
}

export default CityVideosField
