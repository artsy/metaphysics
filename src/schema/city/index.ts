import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"

import { LatLngType } from "../location"
import { showConnection } from "schema/show"
import PartnerShowSorts from "schema/sorts/partner_show_sorts"
import Fair from "schema/fair"
import FairSorts from "schema/sorts/fair_sorts"
import EventStatus from "schema/input_fields/event_status"

import cityData from "./city_data.json"
import { pageable } from "relay-cursor-paging"
import { connectionFromArray } from "graphql-relay"

const LOCAL_DISCOVERY_RADIUS_KM = 75

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
      type: showConnection,
      args: pageable({
        size: {
          type: GraphQLInt,
        },
        sort: PartnerShowSorts,
        status: EventStatus,
      }),
      resolve: (city, args, _context, { rootValue: { showsLoader } }) => {
        const gravityOptions = {
          ...args,
          displayable: true,
          near: `${city.coordinates.lat},${city.coordinates.lng}`,
          max_distance: LOCAL_DISCOVERY_RADIUS_KM,
        }

        return showsLoader(gravityOptions).then(response => {
          return connectionFromArray(response, args)
        })
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
      `City ${slug} not found in: ${Object.keys(cityData).join(", ")}`
    )
  }
  return cityData[slug]
}
