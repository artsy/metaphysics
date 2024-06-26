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
import { LatLngType } from "./location"

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
    city: { type: GraphQLString },
    countryCode: { type: GraphQLString },
    coordinates: {
      type: LatLngType,
    },
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
      } = await requestLocationLoader({ ip })

      if (config.ENABLE_GEOLOCATION_LOGGING) {
        logRateHeaders(headers)
      }

      // Unspecified/unknown address
      if (!("location" in data)) {
        return { id: base64(ip), cached }
      }

      const { alpha2: countryCode, name: country } = data.location.country
      const { name: city } = data.location.city
      const { latitude: lat, longitude: lng } = data.location

      return {
        id: base64(ip),
        country,
        countryCode,
        cached,
        city,
        coordinates: { lat, lng },
      }
    } catch (error) {
      // Likely, an invalid IP address
      console.error(error)

      return { id: base64(ip), cached: false }
    }
  },
}
