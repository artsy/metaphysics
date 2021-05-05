import { GraphQLFieldConfig, GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { IDFields } from "./object_identification"

export const RequestLocationType = new GraphQLObjectType<any, ResolverContext>({
  name: "Request Location",
  fields: () => ({
    ...IDFields,
    country: {
      type: GraphQLString,
      resolve: ({ country_name }) => country_name,
    },
    countryCode: {
      type: GraphQLString,
      resolve: ({ country_code }) => country_code,
    },
    city: {
      type: GraphQLString,
    },
    zip: {
      type: GraphQLString,
    },
  }),
})

export const RequestLocationField: GraphQLFieldConfig<void, ResolverContext> = {
  type: RequestLocationType,
  description: "A requested location",
}
