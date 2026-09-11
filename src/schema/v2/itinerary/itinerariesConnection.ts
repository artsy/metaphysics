import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLString,
} from "graphql"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import { ItineraryType } from "./itinerary"
import { attachStopItems } from "./stopItems"

export const ItinerariesConnectionType = connectionWithCursorInfo({
  name: "Itineraries",
  nodeType: ItineraryType,
}).connectionType

interface ItinerariesConnectionArgs extends CursorPageable {
  citySlug?: string
  isCurated?: boolean
  page?: number
  size?: number
}

interface ItinerariesConnectionOptions {
  // Ignored when `onlyOwnedBy` is set.
  userID?: string | null
  onlyOwnedBy?: string | null
}

// Shared by the root `itinerariesConnection` field and `Me.itinerariesConnection`.
export const resolveItinerariesConnection = async (
  args: ItinerariesConnectionArgs,
  context: ResolverContext,
  options: ItinerariesConnectionOptions = {}
) => {
  const loader =
    context.itinerariesLoader ??
    context.unauthenticatedLoaders?.itinerariesLoader
  if (!loader) return null

  const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

  const { body, headers } = await loader({
    page,
    size,
    total_count: true,
    ...(args.citySlug ? { city_slug: args.citySlug } : {}),
    ...(typeof args.isCurated === "boolean"
      ? { is_curated: args.isCurated }
      : {}),
    ...(options.onlyOwnedBy ? { user_id: options.onlyOwnedBy } : {}),
  })

  const totalCount = parseInt(headers["x-total-count"] || "0", 10)

  await Promise.all(
    body.map((itinerary) => attachStopItems(itinerary, context))
  )

  return paginationResolver({
    totalCount,
    offset,
    page,
    size,
    body,
    args,
  })
}

export const ItinerariesConnectionField: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: ItinerariesConnectionType,
  description: "A connection of City Guide itineraries",
  args: pageable({
    citySlug: {
      type: GraphQLString,
      description: "Only itineraries for this city",
    },
    isCurated: {
      type: GraphQLBoolean,
      description: "Only curated (editorial) or only personal itineraries",
    },
    page: { type: GraphQLInt },
    size: { type: GraphQLInt },
  }),
  resolve: (_root, args, context) =>
    resolveItinerariesConnection(args, context, { userID: context.userID }),
}

export default ItinerariesConnectionField
