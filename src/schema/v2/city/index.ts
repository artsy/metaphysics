import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
} from "graphql"
import { LatLngType } from "../location"
import ShowSorts from "schema/v2/sorts/show_sorts"
import FairSorts from "schema/v2/sorts/fair_sorts"
import EventStatus, {
  EventStatusEnums,
} from "schema/v2/input_fields/event_status"
import { pageable, CursorPageable } from "relay-cursor-paging"
import { connectionFromArraySlice } from "graphql-relay"
import {
  LOCAL_DISCOVERY_RADIUS_KM,
  NEAREST_CITY_THRESHOLD_KM,
} from "./constants"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import Near from "schema/v2/input_fields/near"
import { LatLng, distance } from "lib/geospatial"
import { ResolverContext } from "types/graphql"
import { allViaLoader, MAX_GRAPHQL_INT } from "lib/all"
import { StaticPathLoader } from "lib/loaders/api/loader_interface"
import { BodyAndHeaders } from "lib/loaders"
import { sponsoredContentForCity } from "lib/sponsoredContent"
import { createPageCursors } from "../fields/pagination"
import { HTTPError } from "lib/HTTPError"

export interface TCity {
  slug: string
  name: string
  full_name: string
  /** [lat, lng] */
  coords: [number, number]
}

const PartnerShowPartnerType = new GraphQLEnumType({
  name: "PartnerShowPartnerType",
  values: {
    GALLERY: { value: ["Gallery"] },
    MUSEUM: { value: ["Institution", "Institutional Seller"] },
  },
})

export const CityType = new GraphQLObjectType<TCity, ResolverContext>({
  name: "City",
  fields: () => {
    const { ShowsConnection } = require("../show")
    const { fairConnection } = require("../fair")
    return {
      slug: { type: new GraphQLNonNull(GraphQLString) },
      name: { type: new GraphQLNonNull(GraphQLString) },
      fullName: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: ({ full_name }) => full_name,
      },
      coordinates: {
        type: LatLngType,
        resolve: ({ coords }) => {
          return {
            lat: coords[0],
            lng: coords[1],
          }
        },
      },
      showsConnection: {
        type: ShowsConnection.connectionType,
        args: pageable({
          sort: {
            type: ShowSorts,
          },
          status: {
            type: EventStatus.type,
            defaultValue: EventStatusEnums.getValue("CURRENT")?.value,
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
          maxPerPartner: {
            description:
              "Caps number of shows per partner (may result in uneven page sizes)",
            type: GraphQLInt,
          },
          page: { type: GraphQLInt },
          size: { type: GraphQLInt },
        }),
        resolve: async (city: TCity, args, { showsWithHeadersLoader }) => {
          return loadData(args, showsWithHeadersLoader, {
            ...(city.slug === "online"
              ? { has_location: false }
              : {
                  near: city.coords.join(","),
                  max_distance: LOCAL_DISCOVERY_RADIUS_KM,
                  has_location: true,
                }),
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
            max_per_partner: args.maxPerPartner,
          })
        },
      },
      fairsConnection: {
        type: fairConnection.connectionType,
        args: pageable({
          sort: FairSorts,
          status: EventStatus,
        }),
        resolve: (city, args, { fairsLoader }) =>
          loadData(args, fairsLoader, {
            near: city.coords.join(","),
            max_distance: LOCAL_DISCOVERY_RADIUS_KM,
            sort: args.sort,
            status: args.status,
          }),
      },
      sponsoredContent: {
        type: new GraphQLObjectType<any, ResolverContext>({
          name: "CitySponsoredContent",
          fields: () => {
            const { ShowType, ShowsConnection } = require("../show")
            return {
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
            }
          },
        }),
        resolve: (city) => sponsoredContentForCity(city.slug),
      },
    }
  },
})

const ONLINE: TCity = {
  slug: "online",
  name: "Online",
  full_name: "Online",
  coords: [0, 0], // https://en.wikipedia.org/wiki/Null_Island
}

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
  resolve: async (_obj, { slug, near }, { geodataCitiesLoader }) => {
    if (slug && near) {
      throw new Error('The "slug" and "near" arguments are mutually exclusive.')
    }

    if (!slug && !near) {
      throw new Error('One of the arguments "slug" or "near" is required.')
    }

    if (slug === "online") {
      return ONLINE
    }

    const allCities = await geodataCitiesLoader()

    if (slug) {
      return lookupCity(slug, allCities)
    }

    if (near) {
      return nearestCity(near, allCities)
    }
  },
}

const lookupCity = (slug: string, cities: TCity[]) => {
  const city = cities.find((c) => c.slug === slug)

  if (!city) {
    throw new HTTPError(`City "${slug}" not found`, 404)
  }

  return city
}

const nearestCity = (latLng: LatLng, cities: TCity[]) => {
  const orderedCities = citiesOrderedByDistance(latLng, cities)
  const closestCity = orderedCities[0]

  if (isCloseEnough(latLng, closestCity)) {
    return closestCity
  }

  return null
}

const citiesOrderedByDistance = (latLng: LatLng, cities: TCity[]): TCity[] => {
  cities.sort((a, b) => {
    const distanceA = distance(latLng, { lat: a.coords[0], lng: a.coords[1] })
    const distanceB = distance(latLng, { lat: b.coords[0], lng: b.coords[1] })
    return distanceA - distanceB
  })

  return cities
}

const isCloseEnough = (latLng: LatLng, city: TCity) =>
  distance(latLng, { lat: city.coords[0], lng: city.coords[1] }) <
  NEAREST_CITY_THRESHOLD_KM * 1000

async function loadData(
  args: CursorPageable,
  loader: StaticPathLoader<BodyAndHeaders>,
  baseParams: { [key: string]: any }
) {
  if (args.first === MAX_GRAPHQL_INT) {
    // TODO: We could throw an error if the `after` arg is passed, but not doing so, for now.
    const offset = 0
    const response = await allViaLoader(loader, {
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

    const { headers, body } = response
    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return {
      totalCount,
      ...connectionFromArraySlice(body, args, {
        arrayLength: totalCount,
        sliceStart: offset,
      }),
    }
  }

  const { offset, size, page } = convertConnectionArgsToGravityArgs(args)

  const response = await loader({
    ...baseParams,
    size: size ?? 0,
    page: page ?? 1,
    total_count: true,
  })

  const { headers, body } = response
  const totalCount = parseInt(headers["x-total-count"] || "0", 10)

  return {
    totalCount,
    pageCursors: createPageCursors({ page, size }, totalCount),
    ...connectionFromArraySlice(body, args, {
      arrayLength: totalCount,
      sliceStart: offset,
    }),
  }
}
