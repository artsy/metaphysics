import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { createPageCursors } from "schema/v2/fields/pagination"
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
  }),
  resolve: async (_root, args, { showsWithHeadersLoader }) => {
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

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
