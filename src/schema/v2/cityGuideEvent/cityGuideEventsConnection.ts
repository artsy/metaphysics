import { GraphQLEnumType, GraphQLFieldConfig, GraphQLInt } from "graphql"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import { TCity } from "schema/v2/city"
import { CityGuideEventType } from "./cityGuideEvent"

export const CityGuideEventStatusEnum = new GraphQLEnumType({
  name: "CityGuideEventStatus",
  values: {
    CURRENT: { value: true, description: "End date hasn't passed" },
    PAST: { value: false, description: "End date has passed" },
  },
})

export const CityGuideEventsConnectionType = connectionWithCursorInfo({
  name: "CityGuideEvents",
  nodeType: CityGuideEventType,
}).connectionType

interface CityGuideEventsConnectionArgs extends CursorPageable {
  status?: boolean
  page?: number
  size?: number
}

export const CityGuideEventsConnectionField: GraphQLFieldConfig<
  TCity,
  ResolverContext
> = {
  type: CityGuideEventsConnectionType,
  description: "A connection of City Guide events for this city",
  args: pageable({
    status: {
      type: CityGuideEventStatusEnum,
      description: "Only current, or only past, events",
    },
    page: { type: GraphQLInt },
    size: { type: GraphQLInt },
  }),
  resolve: async (
    city,
    args: CityGuideEventsConnectionArgs,
    { cityGuideEventsLoader }
  ) => {
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await cityGuideEventsLoader({
      page,
      size,
      total_count: true,
      city_slug: city.slug,
      ...(typeof args.status === "boolean" ? { current: args.status } : {}),
    })

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return paginationResolver({ totalCount, offset, page, size, body, args })
  },
}
