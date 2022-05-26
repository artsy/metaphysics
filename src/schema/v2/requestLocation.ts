import {
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import config from "config"

const logRateHeaders = (headers) => {
  const headerKeys = [...Object.keys(headers)]
  const matchingHeaders = headerKeys
    .filter((key) => /rate/.test(key))
    .map((key) => `${key}: ${headers[key]}`)
    .join(", ")

  console.log("[schema/requestLocation.ts] Headers:", matchingHeaders)
}

export const RequestLocationType = new GraphQLObjectType<any, ResolverContext>({
  name: "RequestLocation",
  fields: () => ({
    country: { type: GraphQLString },
    countryCode: { type: GraphQLString },
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
  resolve: async (_root, args, { requestLocationLoader }) => {
    const { body, headers } = await requestLocationLoader({ ip: args.ip })

    if (config.ENABLE_GEOLOCATION_LOGGING) {
      logRateHeaders(headers)
    }

    const { alpha2: countryCode, name: country } = body.data.location.country

    return { country, countryCode }
  },
}
