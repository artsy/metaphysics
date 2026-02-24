import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import { ModelChangeType } from "./ModelChangeType"

const ModelChangeConnection = connectionWithCursorInfo({
  nodeType: ModelChangeType,
})

const TrackableTypeEnum = new GraphQLEnumType({
  name: "ModelChangeTrackableType",
  values: {
    ARTWORK: { value: "Artwork" },
  },
})

export const modelChangesConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: ModelChangeConnection.connectionType,
  description: "A paginated list of changes recorded for a trackable model.",
  args: pageable({
    trackableType: {
      type: new GraphQLNonNull(TrackableTypeEnum),
      description: "The type of the trackable record.",
    },
    trackableId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the trackable record.",
    },
  }),
  resolve: async (_root, args, { modelChangesLoader }) => {
    if (!modelChangesLoader) {
      throw new Error("You need to be signed in to view model changes.")
    }

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await modelChangesLoader({
      trackable_type: args.trackableType,
      trackable_id: args.trackableId,
      page,
      size,
      total_count: true,
    })

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return paginationResolver({ args, body, offset, page, size, totalCount })
  },
}
