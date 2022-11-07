import { pageable } from "relay-cursor-paging"
import {
  GraphQLInt,
  GraphQLString,
  GraphQLBoolean,
  GraphQLFieldConfig,
} from "graphql"
import ShowSorts from "schema/v2/sorts/show_sorts"
import { reject, includes } from "lodash"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { ResolverContext } from "types/graphql"
import { ShowsConnection } from "../show"
import { paginationResolver } from "../fields/pagination"

// TODO: Fix upstream, for now we remove shows from certain Partner types
const denyListedPartnerTypes = [
  "Private Dealer",
  "Demo",
  "Private Collector",
  "Auction",
]

// FIXME: Filtering like this can lead to gaps in grids and/or blank pages
export function showsWithDenyListedPartnersRemoved(shows) {
  return reject(shows, (show) => {
    if (show.partner) {
      return includes(denyListedPartnerTypes, show.partner.type)
    }
    if (show.galaxy_partner_id) {
      return false
    }
    return true
  })
}

export const ShowsConnectionField: GraphQLFieldConfig<
  { id: string },
  ResolverContext
> = {
  type: ShowsConnection.connectionType,
  args: pageable({
    active: { type: GraphQLBoolean },
    atAFair: { type: GraphQLBoolean },
    isReference: { type: GraphQLBoolean },
    page: { type: GraphQLInt },
    size: {
      type: GraphQLInt,
      description: "The number of PartnerShows to return",
    },
    soloShow: { type: GraphQLBoolean },
    status: { type: GraphQLString },
    topTier: { type: GraphQLBoolean },
    visibleToPublic: { type: GraphQLBoolean },
    sort: { type: ShowSorts },
  }),
  resolve: async ({ id }, args, { relatedShowsLoader }) => {
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await relatedShowsLoader({
      active: args.active,
      artist_id: id,
      at_a_fair: args.atAFair,
      is_reference: args.isReference,
      // /related endpoint doesn't support offset based navigation
      page,
      size,
      solo_show: args.soloShow,
      sort: args.sort || "-end_at",
      status: args.status,
      top_tier: args.topTier,
      total_count: true,
      visible_to_public: args.visibleToPublic,
    })

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)
    const allowListedShows = showsWithDenyListedPartnersRemoved(body)

    return paginationResolver({
      totalCount,
      offset,
      page,
      size,
      body: allowListedShows,
      args,
    })
  },
}
