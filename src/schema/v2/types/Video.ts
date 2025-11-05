import {
  GraphQLID,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import uuid from "uuid/v5"
import { ResolverContext } from "types/graphql"
import { markdown } from "../fields/markdown"

interface VideoTypeProps {
  _id: string
  title: string
  description?: string
  playerUrl?: string // if Artwork
  player_embed_url?: string // if Video
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
      title: {
        description: "Title of the video",
        type: GraphQLNonNull(GraphQLString),
        resolve: (parent, _args, _context, _info) => {
          return parent?.title || ""
        },
      },
      description: markdown(),
      playerUrl: {
        description:
          "Returns a full-qualified url that can be embedded in an iframe player",
        type: GraphQLNonNull(GraphQLString),
        resolve: (parent, _args, _context, _info) => {
          const {
            playerUrl, // if Artwork
            player_embed_url, // if Video
          } = parent
          return playerUrl || player_embed_url
        },
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
