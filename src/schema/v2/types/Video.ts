import {
  GraphQLID,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import uuid from "uuid/v5"
import { ResolverContext } from "types/graphql"

export const VideoType = new GraphQLObjectType<any, ResolverContext>({
  name: "Video",
  description: "An object containing video metadata",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: ({ url }) => {
        return uuid(url, uuid.URL)
      },
    },
    url: {
      description: "The url of the video",
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
})
