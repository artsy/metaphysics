import { GraphQLFieldConfig, GraphQLObjectType, GraphQLString } from "graphql"
import fetch from "node-fetch"
import { ResolverContext } from "types/graphql"
import { IDFields } from "./object_identification"

export const RequestLocationType = new GraphQLObjectType<any, ResolverContext>({
  name: "RequestLocation",
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
  resolve: (_root, _args) => {
    return fetch(
      `http://api.ipstack.com/134.201.250.155?access_key=${process.env.IPSTACK_API_KEY}`
    )
      .then((response) => response.json())
      .then((response) => {
        response.id = response.ip
        console.log(response)
        return response
      })
  },
}
