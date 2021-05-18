import {
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import fetch from "node-fetch"
import { ResolverContext } from "types/graphql"

export const RequestLocationType = new GraphQLObjectType<any, ResolverContext>({
  name: "RequestLocation",
  fields: () => ({
    country: {
      type: GraphQLString,
      resolve: ({ country_name }) => country_name,
    },
    countryCode: {
      type: GraphQLString,
      resolve: ({ country_code }) => country_code,
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
    return fetch(`https://freegeoip.app/json/${args.ip}`)
      .then((response) => response.json())
      .then((response) => {
        return response
      })
      .catch((error) => {
        console.error("[schema/requestLocation.ts] Error:", error)
        return null
      })
  },
}
