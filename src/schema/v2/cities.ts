import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { CityType } from "./city"

export const cities: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(CityType))),
  description: "A list of cities",
  args: {
    featured: { type: GraphQLBoolean, defaultValue: false },
  },
  resolve: (
    _root,
    args,
    { geodataCitiesLoader, geodataFeaturedCitiesLoader }
  ) => {
    if (args.featured) {
      return geodataFeaturedCitiesLoader()
    }

    return geodataCitiesLoader()
  },
}
