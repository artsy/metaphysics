import {
  GraphQLFieldConfig,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import cached from "schema/v2/fields/cached"
import config from "config"
import { base64 } from "lib/base64"

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
    cached,
    id: { type: new GraphQLNonNull(GraphQLID) },
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
    const { body, headers, cached } = await requestLocationLoader({
      ip: args.ip,
    })

    if (config.ENABLE_GEOLOCATION_LOGGING) {
      logRateHeaders(headers)
    }

    const { alpha2: countryCode, name: country } = body.data.location.country

    return { id: base64(args.ip), country, countryCode, cached }
  },
}
