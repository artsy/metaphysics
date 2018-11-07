import { pageable } from "relay-cursor-paging"
import { GraphQLInt, GraphQLString, GraphQLBoolean } from "graphql"
import PartnerShowSorts from "schema/sorts/partner_show_sorts"
import { merge, defaults, reject, includes, omit } from "lodash"
import { createPageCursors } from "schema/fields/pagination"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { connectionFromArraySlice } from "graphql-relay"

// TODO: Fix upstream, for now we remove shows from certain Partner types
const blacklistedPartnerTypes = [
  "Private Dealer",
  "Demo",
  "Private Collector",
  "Auction",
]
export function showsWithBLacklistedPartnersRemoved(shows) {
  return reject(shows, show => {
    if (show.partner) {
      return includes(blacklistedPartnerTypes, show.partner.type)
    }
    if (show.galaxy_partner_id) {
      return false
    }
    return true
  })
}

const ShowArgs = {
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
export const ShowField = {
  args: ShowArgs,
  resolve: (
    { id },
    options,
    request,
    { rootValue: { relatedShowsLoader } }
  ) => {
    return relatedShowsLoader(
      defaults(options, {
        artist_id: id,
        sort: "-end_at",
      })
    ).then(({ body: shows }) => showsWithBLacklistedPartnersRemoved(shows))
  },
}

export const ShowsConnectionField = {
  args: pageable(ShowArgs),
  resolve: ({ id }, args, _request, { rootValue: { relatedShowsLoader } }) => {
    const pageOptions = convertConnectionArgsToGravityArgs(args)
    const { page, size, offset } = pageOptions
    const gravityArgs = omit(args, ["first", "after", "last", "before"])
    return relatedShowsLoader(
      defaults(gravityArgs, pageOptions, {
        artist_id: id,
        sort: "-end_at",
        total_count: true,
      })
    ).then(({ body, headers }) => {
      const totalCount = headers["x-total-count"]
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
