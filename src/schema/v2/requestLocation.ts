import config from "config"
import {
  GraphQLFieldConfig,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { base64 } from "lib/base64"
import cached from "schema/v2/fields/cached"
import { ResolverContext } from "types/graphql"

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
      type: GraphQLString,
    },
  },
  resolve: async (_root, args, { requestLocationLoader, ipAddress }) => {
    const ip = args.ip || ipAddress

    try {
      const {
        body: { data },
        headers,
        cached,
      } = await requestLocationLoader({ ip: args.ip || ipAddress })

      if (config.ENABLE_GEOLOCATION_LOGGING) {
        logRateHeaders(headers)
      }

      debugger

      // Unspecified/unknown address
      if (!("location" in data)) {
        return { id: base64(ip), cached }
      }

      const { alpha2: countryCode, name: country } = data.location.country

      return { id: base64(ip), country, countryCode, cached }
    } catch (error) {
      // Likely, an invalid IP address
      console.error(error)

      return { id: base64(ip), cached: false }
    }
  },
}
