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
import { FixtureItinerary, fixtureItineraries } from "./fixtures/itineraries"
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
  /** The requesting viewer, if any. Used to also surface their own
   * itineraries alongside public ones. Ignored when `onlyOwnedBy` is set. */
  userID?: string | null
  /** Restricts the listing to exactly this owner's itineraries, of any
   * visibility — the shape `Me.itinerariesConnection` needs. */
  onlyOwnedBy?: string | null
}

// An unlisted itinerary is reached only by presenting its share token —
// listing it hands out the very thing the token exists to gate. So a
// listing includes an itinerary only when it's actually public
// (`published_at` present), or it's the caller's own itinerary regardless
// of visibility. Note this is deliberately NOT "publicly readable"
// (public-or-unlisted) — that's the right predicate for the `itinerary`
// single-item field (which authorizes via a presented share token), but
// the wrong one here.
const isListableFor = (
  itinerary: FixtureItinerary,
  userID?: string | null
): boolean => {
  const isPublic = !!itinerary.published_at
  const isOwnItinerary = !!userID && itinerary.user_id === userID

  return isPublic || isOwnItinerary
}

/**
 * Shared by the root `itinerariesConnection` field and
 * `Me.itinerariesConnection`. Once Gravity ships itinerary endpoints, this
 * is the one place that swaps the fixture read for a loader call.
 */
export const resolveItinerariesConnection = async (
  args: ItinerariesConnectionArgs,
  context: ResolverContext,
  options: ItinerariesConnectionOptions = {}
) => {
  const all = fixtureItineraries() ?? []

  const filtered = all.filter((itinerary) => {
    if (args.citySlug && itinerary.city_slug !== args.citySlug) return false
    if (
      typeof args.isCurated === "boolean" &&
      itinerary.is_curated !== args.isCurated
    ) {
      return false
    }

    if (options.onlyOwnedBy) {
      return itinerary.user_id === options.onlyOwnedBy
    }

    return isListableFor(itinerary, options.userID)
  })

  const { page, size, offset } = convertConnectionArgsToGravityArgs(args)
  const totalCount = filtered.length
  const pageItems = filtered.slice(offset, offset + size)

  await Promise.all(
    pageItems.map((itinerary) => attachStopItems(itinerary, context))
  )

  return paginationResolver({
    totalCount,
    offset,
    page,
    size,
    body: pageItems,
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
