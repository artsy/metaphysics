import {
  GraphQLID,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import uuid from "uuid/v5"
import { ResolverContext } from "types/graphql"

interface VideoTypeProps {
  id: string
  playerUrl: string
  height: number
  width: number
}

export const VideoType = new GraphQLObjectType<VideoTypeProps, ResolverContext>(
  {
    name: "Video",
    description: "An object containing video metadata",
    fields: {
      id: {
        type: new GraphQLNonNull(GraphQLID),
        resolve: ({ playerUrl }) => {
          return uuid(playerUrl, uuid.URL)
        },
      },
      playerUrl: {
        description:
          "Returns a full-qualified url that can be embedded in an iframe player",
        type: GraphQLNonNull(GraphQLString),
      },
      height: {
        description: "The height of the video",
        type: GraphQLNonNull(GraphQLInt),
      },
      width: {
        description: "The width of the video",
        type: GraphQLNonNull(GraphQLInt),
      },
    },
  }
)
