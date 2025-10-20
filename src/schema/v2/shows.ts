import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import {
  createPageCursors,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { ShowsConnection } from "./show"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { connectionFromArraySlice } from "graphql-relay"
import ShowSorts, { ShowSortsType } from "./sorts/show_sorts"
import { pick } from "lodash"
import EventStatus, { EventStatusType } from "./input_fields/event_status"

export const Shows: GraphQLFieldConfig<
  void,
  ResolverContext,
  {
    ids?: string[]
    hasLocation?: boolean
    sort?: ShowSortsType
    displayable?: boolean
    atAFair?: boolean
    status?: EventStatusType
    maxPerPartner?: number
  } & CursorPageable
> = {
  type: ShowsConnection.connectionType,
  description: "A list of Shows",
  args: pageable({
    ids: {
      type: new GraphQLList(GraphQLString),
    },
    hasLocation: {
      type: GraphQLBoolean,
    },
    sort: {
      type: ShowSorts,
    },
    displayable: {
      type: GraphQLBoolean,
      defaultValue: true,
    },
    atAFair: {
      type: GraphQLBoolean,
    },
    status: {
      type: EventStatus.type,
    },
    term: {
      description: "If present, will search by term",
      type: GraphQLString,
    },
    maxPerPartner: {
      description:
        "Caps number of shows per partner (may result in uneven page sizes)",
      type: GraphQLInt,
    },
  }),
  resolve: async (
    _root,
    args,
    { showsWithHeadersLoader, matchShowsLoader }
  ) => {
    const { term } = args

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    if (term) {
      if (!matchShowsLoader) {
        throw new Error(
          "You need to pass a X-Access-Token header to perform this action"
        )
      }

      const gravityArgs: {
        page: number
        size: number
        total_count: boolean
        term?: string
        id?: string[]
      } = { page, size, term, total_count: true }

      const { body, headers } = await matchShowsLoader(gravityArgs)

      const totalCount = parseInt(headers["x-total-count"] || "0", 10)

      return paginationResolver({
        args,
        body,
        offset,
        page,
        size,
        totalCount,
      })
    }

    const { body, headers } = await showsWithHeadersLoader({
      total_count: true,
      page,
      size,
      id: args.ids,
      has_location: args.hasLocation,
      sort: args.sort,
      displayable: args.displayable,
      at_a_fair: args.atAFair,
      status: args.status,
      max_per_partner: args.maxPerPartner,
    })

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return {
      totalCount,
      pageCursors: createPageCursors({ page, size }, totalCount),
      ...connectionFromArraySlice(
        body,
        pick(args, "before", "after", "first", "last"),
        {
          arrayLength: totalCount,
          sliceStart: offset,
        }
      ),
    }
  },
}
