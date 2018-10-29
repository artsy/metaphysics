import {
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"

import Show from "schema/show"
import EventStatus from "schema/input_fields/event_status"
import PartnerShowSorts from "schema/sorts/partner_show_sorts"

import cityData from "./city_data.json"

const LOCAL_DISCOVERY_RADIUS_KM = 75

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
    shows: {
      type: new GraphQLList(Show.type),
      args: {
        size: { type: GraphQLInt },
        sort: PartnerShowSorts,
        status: EventStatus,
      },
      resolve: (obj, args, _context, { rootValue: { showsLoader } }) => {
        let gravityOptions = {
          ...args,
          displayable: true,
          near: `${obj.coordinates.lat},${obj.coordinates.lng}`,
          max_distance: LOCAL_DISCOVERY_RADIUS_KM,
        }

        // here is where we could fetch non-partner shows and
        // merge them in with partner shows.
        //
        // but how to deal with sorting across two disparate
        // collections?
        //
        // then again, if we model non-partner shows akin to
        // current reference shows, this problem may be solvable

        return showsLoader(gravityOptions)
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
