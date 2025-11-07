import { GraphQLFieldConfig, GraphQLEnumType, GraphQLString } from "graphql"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "./fields/pagination"
import { VideoType } from "./types/Video"
import { ResolverContext } from "types/graphql"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"

const VideosConnectionType = connectionWithCursorInfo({ nodeType: VideoType })

const VideoSorts = new GraphQLEnumType({
  name: "VideoSorts",
  values: {
    CREATED_AT_ASC: { value: "created_at" },
    CREATED_AT_DESC: { value: "-created_at" },
    UPDATED_AT_ASC: { value: "updated_at" },
    UPDATED_AT_DESC: { value: "-updated_at" },
  },
})

export const VideosConnection: GraphQLFieldConfig<void, ResolverContext> = {
  type: VideosConnectionType.connectionType,
  args: pageable({
    term: {
      type: GraphQLString,
    },
    sort: {
      type: VideoSorts,
      defaultValue: VideoSorts.getValue("UPDATED_AT_DESC")?.value,
    },
  }),
  resolve: async (_parent, args, context, _info) => {
    const { videosLoader } = context

    if (!videosLoader) {
      throw new Error("You need to be logged in to perform this action")
    }

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const gravityArgs = {
      term: args.term,
      page,
      size,
      sort: args.sort,
      total_count: true,
    }

    const { body, headers } = await videosLoader(gravityArgs)

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
