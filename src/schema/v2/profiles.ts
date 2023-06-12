import { GraphQLFieldConfig, GraphQLList, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { ProfileType } from "./profile"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"

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
    if (!matchProfilesLoader || !profilesLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    const { term } = args
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const gravityArgs: {
      page: number
      size: number
      total_count: boolean
      term?: string
      id?: string[]
    } = { page, size, total_count: true }

    if (term) gravityArgs.term = term
    if (args.ids) gravityArgs.id = args.ids

    const loader = term ? matchProfilesLoader : profilesLoader

    const { body, headers } = await loader(gravityArgs)

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return paginationResolver({
      args,
      body,
      offset,
      page,
      size,
      totalCount,
    })
  },
}
