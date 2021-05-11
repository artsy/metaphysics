import {
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
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
  args: {
    ip: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (_root, args) => {
    return fetch(
      `http://api.ipstack.com/${args.ip}?access_key=${process.env.IPSTACK_API_KEY}`
    )
      .then((response) => response.json())
      .then((response) => {
        response.id = response.ip
        console.log(response)
        return response
      })
  },
}
