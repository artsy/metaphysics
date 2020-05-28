import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"

import { LatLngType } from "../location"
import { ShowsConnection, ShowType } from "schema/v2/show"
import ShowSorts from "schema/v2/sorts/show_sorts"
import { fairConnection } from "schema/v2/fair"
import FairSorts from "schema/v2/sorts/fair_sorts"
import EventStatus from "schema/v2/input_fields/event_status"
import cityDataSortedByDisplayPreference from "./cityDataSortedByDisplayPreference.json"
import { pageable, CursorPageable } from "relay-cursor-paging"
import { connectionFromArraySlice } from "graphql-relay"
import {
  LOCAL_DISCOVERY_RADIUS_KM,
  NEAREST_CITY_THRESHOLD_KM,
} from "./constants"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import Near from "schema/v2/input_fields/near"
import { LatLng, Point, distance } from "lib/geospatial"
import { ResolverContext } from "types/graphql"
import { allViaLoader, MAX_GRAPHQL_INT } from "lib/all"
import { StaticPathLoader } from "lib/loaders/api/loader_interface"
import { BodyAndHeaders } from "lib/loaders"
import { sponsoredContentForCity } from "lib/sponsoredContent"

const PartnerShowPartnerType = new GraphQLEnumType({
  name: "PartnerShowPartnerType",
  values: {
    GALLERY: {
      value: ["Gallery"],
    },
    MUSEUM: {
      value: ["Institution", "Institutional Seller"],
    },
  },
})

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
    showsConnection: {
      type: ShowsConnection.connectionType,
      args: pageable({
        sort: {
          type: ShowSorts,
        },
        status: {
          type: EventStatus.type,
          defaultValue: "CURRENT",
          description: "Filter shows by chronological event status",
        },
        partnerType: {
          type: PartnerShowPartnerType,
          description: "Filter shows by partner type",
        },
        dayThreshold: {
          type: GraphQLInt,
          description:
            "Only used when status is CLOSING_SOON or UPCOMING. Number of days used to filter upcoming and closing soon shows",
        },
        includeStubShows: {
          type: GraphQLBoolean,
          description: "Whether to include local discovery stubs",
        },
      }),
      resolve: async (city, args, { showsWithHeadersLoader }) =>
        loadData(args, showsWithHeadersLoader, {
          near: `${city.coordinates.lat},${city.coordinates.lng}`,
          max_distance: LOCAL_DISCOVERY_RADIUS_KM,
          has_location: true,
          at_a_fair: false,
          ...(args.partnerType && { partner_types: args.partnerType }),
          ...(args.dayThreshold && { day_threshold: args.dayThreshold }),
          sort: args.sort,
          // default Enum value for status is not properly resolved
          // so we have to manually resolve it by lowercasing the value
          // https://github.com/apollographql/graphql-tools/issues/715
          ...(args.status && { status: args.status.toLowerCase() }),
          displayable: true,
          include_local_discovery:
            args.includeStubShows || args.discoverable === true,
          include_discovery_blocked: false,
        }),
    },
    fairsConnection: {
      type: fairConnection.connectionType,
      args: pageable({
        sort: FairSorts,
        status: EventStatus,
      }),
      resolve: (city, args, { fairsLoader }) =>
        loadData(args, fairsLoader, {
          near: `${city.coordinates.lat},${city.coordinates.lng}`,
          max_distance: LOCAL_DISCOVERY_RADIUS_KM,
          sort: args.sort,
          status: args.status,
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
          featuredShows: {
            type: new GraphQLList(ShowType),
            resolve: (citySponsoredContent, _args, { showsLoader }) => {
              return showsLoader({
                id: citySponsoredContent.featuredShowIds,
                include_local_discovery: true,
                displayable: true,
              })
            },
          },
          showsConnection: {
            type: ShowsConnection.connectionType,
            args: pageable({
              sort: {
                type: ShowSorts,
              },
              status: EventStatus,
            }),
            resolve: async (
              citySponsoredContent,
              args,
              { showsWithHeadersLoader }
            ) => {
              return loadData(args, showsWithHeadersLoader, {
                id: citySponsoredContent.showIds,
                include_local_discovery: true,
                displayable: true,
                sort: args.sort,
                status: args.status,
              })
            },
          },
        },
      }),
      resolve: (city) => sponsoredContentForCity(city.slug),
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
  const city = cityDataSortedByDisplayPreference.find((c) => c.slug === slug)
  if (!city) {
    throw new Error(
      `City ${slug} not found in: ${cityDataSortedByDisplayPreference
        .map(({ slug }) => slug)
        .join(", ")}`
    )
  }
  return city
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
  const cities: Point[] = Object.values(cityDataSortedByDisplayPreference)
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
        requestThrottleMs: 7200000, // 1000 * 60 * 60 * 2 = 2 hours
      },
    }).then((data) => ({
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
      size: connectionParams.size || 0,
      page: connectionParams.page || 1,
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
