import {
  GraphQLBoolean,
  GraphQLObjectType,
  GraphQLString,
  GraphQLFieldConfig,
} from "graphql"

import { LatLngType } from "../location"
import { showConnection } from "schema/show"
import PartnerShowSorts from "schema/sorts/partner_show_sorts"
import { FairType } from "schema/fair"
import FairSorts from "schema/sorts/fair_sorts"
import EventStatus from "schema/input_fields/event_status"

import cityData from "./city_data.json"
import { pageable } from "relay-cursor-paging"
import { connectionFromArraySlice } from "graphql-relay"
import {
  LOCAL_DISCOVERY_RADIUS_KM,
  NEAREST_CITY_THRESHOLD_KM,
} from "./constants"
import { convertConnectionArgsToGravityArgs, CursorPageable } from "lib/helpers"
import Near from "schema/input_fields/near"
import { LatLng, Point, distance } from "lib/geospatial"
import { ResolverContext } from "types/graphql"
import { connectionWithCursorInfo } from "schema/fields/pagination"
import { allViaLoader, MAX_GRAPHQL_INT } from "lib/all"
import { StaticPathLoader } from "lib/loaders/api/loader_interface"
import { BodyAndHeaders } from "lib/loaders"
import { sponsoredContentForCity } from "lib/sponsoredContent"

const CityType = new GraphQLObjectType<any, ResolverContext>({
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
        status: {
          type: EventStatus.type,
          defaultValue: "CURRENT",
          description: "By default we filter shows by current",
        },
        discoverable: {
          type: GraphQLBoolean,
          description:
            "Whether to include local discovery stubs as well as displayable shows",
        },
      }),
      resolve: async (city, args, { showsWithHeadersLoader }) =>
        loadData(args, showsWithHeadersLoader, {
          near: `${city.coordinates.lat},${city.coordinates.lng}`,
          max_distance: LOCAL_DISCOVERY_RADIUS_KM,
          has_location: true,
          sort: args.sort,
          // default Enum value for status is not properly resolved
          // so we have to manually resolve it by lowercasing the value
          // https://github.com/apollographql/graphql-tools/issues/715
          status: args.status.toLowerCase(),
          // This is to ensure the key never makes its way into the `baseParams`
          // object if not needed,
          ...(typeof args.discoverable === "undefined"
            ? undefined
            : { discoverable: args.discoverable }),
          ...(typeof args.discoverable === "undefined"
            ? { displayable: true }
            : undefined),
        }),
    },
    fairs: {
      type: connectionWithCursorInfo(FairType),
      args: pageable({
        sort: FairSorts,
        status: EventStatus,
      }),
      resolve: (city, args, { fairsLoader }) =>
        loadData(args, fairsLoader, {
          near: `${city.coordinates.lat},${city.coordinates.lng}`,
          max_distance: LOCAL_DISCOVERY_RADIUS_KM,
        }),
    },
    sponsoredContent: {
      type: new GraphQLObjectType<any, ResolverContext>({
        name: "CitySponsoredContent",
        fields: {
          introText: {
            type: GraphQLString,
          },
          artGuideUrl: {
            type: GraphQLString,
          },
        },
      }),
      resolve: city => sponsoredContentForCity(city.slug),
    },
  },
})

export const City: GraphQLFieldConfig<void, ResolverContext> = {
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

async function loadData(
  args: CursorPageable,
  loader: StaticPathLoader<BodyAndHeaders>,
  baseParams: { [key: string]: any }
) {
  let response
  let offset

  if (args.first === MAX_GRAPHQL_INT) {
    // TODO: We could throw an error if the `after` arg is passed, but not
    //       doing so, for now.
    offset = 0
    response = await allViaLoader(loader, {
      params: baseParams,
      api: {
        requestThrottleMs: 86400000, // 1000 * 60 * 60 * 24 = 1 day
      },
    }).then(data => ({
      // This just creates a body/headers object again, as the code
      // below already expects that.
      // TODO: Perhaps `allViaLoader` should support that out of the box.
      body: data,
      headers: { "x-total-count": data.length.toString() },
    }))
  } else {
    const connectionParams = convertConnectionArgsToGravityArgs(args)
    offset = connectionParams.offset
    response = await loader({
      ...baseParams,
      size: connectionParams.size,
      page: connectionParams.page,
      total_count: true,
    })
  }

  const { headers, body: fairs } = response
  const totalCount = parseInt(headers["x-total-count"] || "0", 10)

  return {
    totalCount,
    ...connectionFromArraySlice(fairs, args, {
      arrayLength: totalCount,
      sliceStart: offset,
    }),
  }
}
