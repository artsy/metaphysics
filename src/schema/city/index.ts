import {
  GraphQLBoolean,
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
import { connectionFromArraySlice } from "graphql-relay"
import { LOCAL_DISCOVERY_RADIUS_KM } from "./constants"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"

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
        sort: PartnerShowSorts,
        status: EventStatus,
        displayable: {
          type: GraphQLBoolean,
          defaultValue: true,
          description: "Whether to include only displayable shows",
        },
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
          displayable: args.displayable,
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
