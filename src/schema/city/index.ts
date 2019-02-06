import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
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
import { connectionFromArraySlice } from "graphql-relay"
import {
  LOCAL_DISCOVERY_RADIUS_KM,
  NEAREST_CITY_THRESHOLD_KM,
} from "./constants"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import Near from "schema/input_fields/near"
import { LatLng, Point, distance } from "lib/geospatial"

const CityType = new GraphQLObjectType<ResolverContext>({
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
        sort: PartnerShowSorts,
        status: EventStatus,
        discoverable: {
          type: GraphQLBoolean,
          description:
            "Whether to include local discovery stubs as well as displayable shows",
        },
      }),
      resolve: async (
        city,
        args,
        _c,
        { rootValue: { showsWithHeadersLoader } }
      ) => {
        const gravityOptions = {
          ...convertConnectionArgsToGravityArgs(args),
          displayable: true,
          near: `${city.coordinates.lat},${city.coordinates.lng}`,
          max_distance: LOCAL_DISCOVERY_RADIUS_KM,
          total_count: true,
        }
        delete gravityOptions.page

        if (args.discoverable) {
          delete gravityOptions.displayable
        }

        const response = await showsWithHeadersLoader(gravityOptions)
        const { headers, body: cities } = response

        const results = connectionFromArraySlice(cities, args, {
          arrayLength: headers["x-total-count"],
          sliceStart: gravityOptions.offset,
        })

        // This is in our schema, so might as well fill it
        // @ts-ignore
        results.totalCount = headers["x-total-count"]
        return results
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
      type: GraphQLString,
      description:
        "A slug for the city, conforming to Gravity's city slug naming conventions",
    },
    near: {
      type: Near,
      description:
        "A point which will be used to locate the nearest local discovery city within a threshold",
    },
  },
  resolve: (_obj, { slug, near }) => {
    if (slug && near) {
      throw new Error('The "slug" and "near" arguments are mutually exclusive.')
    }
    if (!slug && !near) {
      throw new Error('One of the arguments "slug" or "near" is required.')
    }
    if (slug) {
      return lookupCity(slug)
    }
    if (near) {
      return nearestCity(near)
    }
  },
}

const lookupCity = (slug: string) => {
  if (!cityData.hasOwnProperty(slug)) {
    throw new Error(
      `City ${slug} not found in: ${Object.keys(cityData).join(", ")}`
    )
  }
  return cityData[slug]
}

const nearestCity = (latLng: LatLng) => {
  const orderedCities = citiesOrderedByDistance(latLng)
  const closestCity = orderedCities[0]

  if (isCloseEnough(latLng, closestCity)) {
    return closestCity
  }
  return null
}

const citiesOrderedByDistance = (latLng: LatLng): Point[] => {
  let cities: Point[] = Object.values(cityData)
  cities.sort((a, b) => {
    const distanceA = distance(latLng, a.coordinates)
    const distanceB = distance(latLng, b.coordinates)
    return distanceA - distanceB
  })
  return cities
}

const isCloseEnough = (latLng: LatLng, city: Point) =>
  distance(latLng, city.coordinates) < NEAREST_CITY_THRESHOLD_KM * 1000
