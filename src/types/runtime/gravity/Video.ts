import { GraphQLInt, GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "../../graphql"

export const VideoType = new GraphQLObjectType<any, ResolverContext>({
  name: "Video",
  description: "An object containing video metadata",
  fields: {
    src: {
      description: "The url of the video",
      type: GraphQLString,
      resolve: ({ src }) => src,
    },
    height: {
      description: "The height of the video",
      type: GraphQLInt,
      resolve: ({ height }) => height,
    },
    width: {
      description: "The width of the video",
      type: GraphQLInt,
      resolve: ({ width }) => width,
    },
  },
})
