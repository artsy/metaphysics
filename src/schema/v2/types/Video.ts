import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLResolveInfo,
  GraphQLString,
} from "graphql"
import uuid from "uuid/v5"
import { ResolverContext } from "types/graphql"
import { markdown } from "../fields/markdown"
import { toGlobalId } from "graphql-relay"
import { extractEmbed } from "../article/lib/extractEmbed"

interface VideoTypeProps {
  _id: string
  title: string
  description?: string
  playerUrl?: string // if Artwork
  player_embed_url?: string // if Video
  height: number
  width: number
  aspect_ratio?: number
}

export const VideoType = new GraphQLObjectType<VideoTypeProps, ResolverContext>(
  {
    name: "Video",
    description: "An object containing video metadata",
    fields: {
      id: {
        description: "A globally unique ID",
        type: new GraphQLNonNull(GraphQLID),
        resolve: (parent, _args, _context, info) => {
          // if Artwork…
          if (isArtworkContext(info)) {
            // for the original use case of a video url associated directly
            // with an artwork via a field on the artwork model,
            // we derive the global id from that player url
            return uuid(parent.playerUrl, uuid.URL)
          }

          // if Video… a conventional Relay global id,
          return toGlobalId(info.parentType.name, parent._id)
        },
      },
      internalID: {
        description:
          "A database ID for the Gravity Video instance (not available in Artwork context)",
        type: new GraphQLNonNull(GraphQLID),
        resolve: (parent, _args, _context, _info) => {
          return parent._id
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
      embed: {
        description: "Only YouTube and Vimeo are supported",
        args: {
          autoPlay: {
            type: GraphQLBoolean,
            defaultValue: false,
          },
        },
        type: GraphQLString,
        resolve: (parent, { autoPlay }, _context, _info) => {
          const {
            playerUrl, // if Artwork
            player_embed_url, // if Video
          } = parent
          const url = playerUrl || player_embed_url
          if (!url) return null
          const options = { autoplay: autoPlay ? 1 : 0 }
          return extractEmbed(url, options)
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
      aspectRatio: {
        description: "The aspect ratio of the video (width / height)",
        type: GraphQLFloat,
        resolve: ({ aspect_ratio }) => aspect_ratio,
      },
    },
  }
)

function getParentTypename(info: GraphQLResolveInfo): string | undefined {
  let path = info.path?.prev
  while (path) {
    if (path.typename && path.typename !== "Video") {
      return path.typename
    }
    path = path.prev
  }
  return undefined
}

function isArtworkContext(info: GraphQLResolveInfo) {
  const parentType = getParentTypename(info)
  return parentType === "Artwork"
}
