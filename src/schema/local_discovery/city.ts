import {
  GraphQLString,
  GraphQLFloat,
  GraphQLObjectType,
  GraphQLNonNull,
} from "graphql"

import cityData from "./city_data.json"

const LatLngType = new GraphQLObjectType({
  name: "LatLng",
  fields: {
    lat: {
      type: GraphQLFloat,
      resolve: obj => {
        return obj.lat
      },
    },
    lng: {
      type: GraphQLFloat,
      resolve: obj => {
        return obj.lng
      },
    },
  },
})

const LocalDiscoveryCityType = new GraphQLObjectType({
  name: "LocalDiscoveryCity",
  fields: {
    slug: {
      type: GraphQLString,
      resolve: obj => {
        return obj.slug
      },
    },
    name: {
      type: GraphQLString,
      resolve: obj => {
        return obj.name
      },
    },
    coordinates: {
      type: LatLngType,
      resolve: obj => {
        return obj.coordinates
      },
    },
  },
})

export const LocalDiscoveryCity = {
  type: LocalDiscoveryCityType,
  description: "A city-based entry point for local discovery",
  args: {
    slug: {
      type: new GraphQLNonNull(GraphQLString),
      description:
        "A slug for the city, conforming to Gravity's city slug naming conventions",
    },
  },
  resolve: (_obj, args, _context, _info) => {
    return lookupCity(args.slug)
  },
}

const lookupCity = slug => {
  if (!cityData.hasOwnProperty(slug)) {
    throw new Error(
      `City ${slug} not found in : ${Object.keys(cityData).join(", ")}`
    )
  }
  return cityData[slug]
}
