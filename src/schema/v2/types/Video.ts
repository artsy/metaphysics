import {
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
