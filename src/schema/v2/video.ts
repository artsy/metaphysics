import { GraphQLFieldConfig, GraphQLID, GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { VideoType } from "./types/Video"

export const Video: GraphQLFieldConfig<void, ResolverContext> = {
  type: VideoType,
  description: "Find a video by ID",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
    },
  },
  resolve: async (_root, { id }, { videoLoader }) => {
    const result = await videoLoader(id)
    return result
  },
}
