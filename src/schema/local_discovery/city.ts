import {
  GraphQLString,
  GraphQLFloat,
  GraphQLObjectType,
  GraphQLNonNull,
} from "graphql"

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
  const values = {
    "new-york-ny-usa": {
      slug: "new-york-ny-usa",
      name: "New York",
      coordinates: { lat: 40.71, lng: -74.01 },
    },
    "london-united-kingdom": {
      slug: "london-united-kingdom",
      name: "London",
      coordinates: { lat: 51.51, lng: -0.13 },
    },
    "los-angeles-ca-usa": {
      slug: "los-angeles-ca-usa",
      name: "Los Angeles",
      coordinates: { lat: 34.05, lng: -118.24 },
    },
    "paris-france": {
      slug: "paris-france",
      name: "Paris",
      coordinates: { lat: 48.86, lng: 2.35 },
    },
    "berlin-germany": {
      slug: "berlin-germany",
      name: "Berlin",
      coordinates: { lat: 52.52, lng: 13.4 },
    },
    "hong-kong-hong-kong": {
      slug: "hong-kong-hong-kong",
      name: "Hong Kong",
      coordinates: { lat: 22.4, lng: 114.11 },
    },
  }

  if (!values.hasOwnProperty(slug)) {
    throw new Error(
      `City ${slug} not found in : ${Object.keys(values).join(", ")}`
    )
  }

  return values[slug]
}
