import { GraphQLFieldConfig, GraphQLList, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import {
  connectionWithCursorInfo,
  createPageCursors,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { ProfileType } from "./profile"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { connectionFromArraySlice } from "graphql-relay"
import { pick } from "lodash"

export const Profiles: GraphQLFieldConfig<
  void,
  ResolverContext,
  {
    ids?: string[]
    term?: string
  } & CursorPageable
> = {
  type: connectionWithCursorInfo({ nodeType: ProfileType }).connectionType,
  description: "A list of Profiles",
  args: pageable({
    ids: {
      type: new GraphQLList(GraphQLString),
    },
    term: {
      description: "If present, will search by term",
      type: GraphQLString,
    },
  }),
  resolve: async (_root, args, { profilesLoader, matchProfilesLoader }) => {
    const { term } = args

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    if (!matchProfilesLoader || !profilesLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    if (term) {
      const gravityArgs: {
        page: number
        size: number
        total_count: boolean
        term?: string
      } = { page, size, term, total_count: true }

      const { body, headers } = await matchProfilesLoader(gravityArgs)

      console.log("body", body)

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

    const { body, headers } = await profilesLoader({
      total_count: true,
      page,
      size,
      id: args.ids,
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
