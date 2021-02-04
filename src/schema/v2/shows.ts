import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { createPageCursors } from "./fields/pagination"
import { ShowsConnection } from "./show"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { connectionFromArray } from "graphql-relay"
import ShowSorts, { ShowSortsType } from "./sorts/show_sorts"
import { pick } from "lodash"

export const Shows: GraphQLFieldConfig<
  void,
  ResolverContext,
  {
    ids?: string[]
    hasLocation?: boolean
    sort?: ShowSortsType
    displayable?: boolean
    atAFair?: boolean
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
  }),
  resolve: async (_root, args, { showsWithHeadersLoader }) => {
    const { page, size } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await showsWithHeadersLoader({
      total_count: true,
      page,
      size,
      id: args.ids,
      has_location: args.hasLocation,
      sort: args.sort,
      displayable: args.displayable,
      at_a_fair: args.atAFair,
    })

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return {
      totalCount,
      pageCursors: createPageCursors({ page, size }, totalCount),
      ...connectionFromArray(
        body,
        pick(args, "before", "after", "first", "last")
      ),
    }
  },
}
