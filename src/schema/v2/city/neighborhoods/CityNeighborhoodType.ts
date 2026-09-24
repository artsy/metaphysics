import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { CityNeighborhood } from "./matchCityNeighborhood"

export const CityNeighborhoodType = new GraphQLObjectType<
  CityNeighborhood,
  ResolverContext
>({
  name: "CityNeighborhood",
  description:
    "An editorial City Guide neighborhood, matched from postcode prefixes",
  fields: {
    slug: {
      description: "Unique within its city only",
      type: new GraphQLNonNull(GraphQLString),
    },
    name: { type: new GraphQLNonNull(GraphQLString) },
  },
})
