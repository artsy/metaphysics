import {
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"

import Show from "schema/show"
import PartnerShowSorts from "schema/sorts/partner_show_sorts"
import Fair from "schema/fair"
import FairSorts from "schema/sorts/fair_sorts"
import EventStatus from "schema/input_fields/event_status"

import cityData from "./city_data.json"

const LOCAL_DISCOVERY_RADIUS_KM = 75

const LatLngType = new GraphQLObjectType({
  name: "LatLng",
  fields: {
    lat: {
      type: GraphQLFloat,
    },
    lng: {
      type: GraphQLFloat,
    },
  },
})

const CityType = new GraphQLObjectType({
  name: "City",
  fields: {
    slug: {
      type: GraphQLString,
    },
    name: {
      type: GraphQLString,
    },
    coordinates: {
      type: LatLngType,
    },
    shows: {
      type: new GraphQLList(Show.type),
      args: {
        size: { type: GraphQLInt },
        sort: PartnerShowSorts,
        status: EventStatus,
      },
      resolve: (obj, args, _context, { rootValue: { showsLoader } }) => {
        const gravityOptions = {
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
    fairs: {
      type: new GraphQLList(Fair.type),
      args: {
        size: { type: GraphQLInt },
        sort: FairSorts,
        status: EventStatus,
      },
      resolve: (obj, args, _context, { rootValue: { fairsLoader } }) => {
        const gravityOptions = {
          ...args,
          near: `${obj.coordinates.lat},${obj.coordinates.lng}`,
          max_distance: LOCAL_DISCOVERY_RADIUS_KM,
        }
        return fairsLoader(gravityOptions)
      },
    },
  },
})

export const City = {
  type: CityType,
  description: "A city-based entry point for local discovery",
  args: {
    slug: {
      type: new GraphQLNonNull(GraphQLString),
      description:
        "A slug for the city, conforming to Gravity's city slug naming conventions",
    },
  },
  resolve: (_obj, args) => {
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
