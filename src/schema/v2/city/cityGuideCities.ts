import { GraphQLFieldConfig, GraphQLList, GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { CITIES_WITH_GUIDES } from "schema/v2/homeView/sections/citiesWithGuides"
import { CityType, TCity } from "./index"

const CITY_GUIDE_CITIES: TCity[] = CITIES_WITH_GUIDES.map(
  ({ slug, name, coordinates }) => ({
    slug,
    name,
    // CITIES_WITH_GUIDES has no full name, so fall back to the short name.
    full_name: name,
    coords: [coordinates.lat, coordinates.lng],
  })
)

export const CityGuideCities: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(CityType))),
  description: "The cities that have a City Guide, in display order.",
  resolve: () => CITY_GUIDE_CITIES,
}
