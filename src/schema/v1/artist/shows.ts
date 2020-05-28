import { pageable } from "relay-cursor-paging"
import {
  GraphQLInt,
  GraphQLString,
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLFieldConfigArgumentMap,
} from "graphql"
import PartnerShowSorts from "schema/v1/sorts/partner_show_sorts"
import { merge, defaults, reject, includes, omit } from "lodash"
import { createPageCursors } from "schema/v1/fields/pagination"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { connectionFromArraySlice } from "graphql-relay"
import { ResolverContext } from "types/graphql"

// TODO: Fix upstream, for now we remove shows from certain Partner types
const denyListedPartnerTypes = [
  "Private Dealer",
  "Demo",
  "Private Collector",
  "Auction",
]
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

const ShowArgs: GraphQLFieldConfigArgumentMap = {
  active: {
    type: GraphQLBoolean,
  },
  at_a_fair: {
    type: GraphQLBoolean,
  },
  is_reference: {
    type: GraphQLBoolean,
  },
  size: {
    type: GraphQLInt,
    description: "The number of PartnerShows to return",
  },
  solo_show: {
    type: GraphQLBoolean,
  },
  status: {
    type: GraphQLString,
  },
  top_tier: {
    type: GraphQLBoolean,
  },
  visible_to_public: {
    type: GraphQLBoolean,
  },
  sort: PartnerShowSorts,
}

// TODO: Get rid of this when we remove the deprecated PartnerShow in favour of Show.
export const ShowField: GraphQLFieldConfig<{ id: string }, ResolverContext> = {
  type: null as any,
  args: ShowArgs,
  resolve: ({ id }, options, { relatedShowsLoader }) => {
    return relatedShowsLoader(
      defaults(options, {
        artist_id: id,
        sort: "-end_at",
      })
    ).then(({ body: shows }) => showsWithDenyListedPartnersRemoved(shows))
  },
}

export const ShowsConnectionField: GraphQLFieldConfig<
  { id: string },
  ResolverContext
> = {
  type: null as any,
  args: pageable(ShowArgs),
  resolve: ({ id }, args, { relatedShowsLoader }) => {
    const pageOptions = convertConnectionArgsToGravityArgs(args)
    const { page, size, offset } = pageOptions
    const gravityArgs = omit(args, ["first", "after", "last", "before"])
    return relatedShowsLoader(
      defaults(gravityArgs, pageOptions, {
        artist_id: id,
        sort: "-end_at",
        total_count: true,
      })
    )
      .then(({ body, headers }) => {
        const allowListedShows = showsWithDenyListedPartnersRemoved(body)
        return { body: allowListedShows, headers }
      })
      .then(({ body, headers }) => {
        const totalCount = parseInt(headers["x-total-count"] || "0", 10)
        const totalPages = Math.ceil(totalCount / size)

        return merge(
          {
            pageCursors: createPageCursors(pageOptions, totalCount),
            totalCount,
          },
          connectionFromArraySlice(body, args, {
            arrayLength: totalCount,
            sliceStart: offset,
          }),
          {
            pageInfo: {
              hasPreviousPage: page > 1,
              hasNextPage: page < totalPages,
            },
          }
        )
      })
  },
}
