import {
  GraphQLEnumType,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { IDFields } from "schema/v2/object_identification"
import { GravityVideo, VideoType } from "schema/v2/types/Video"
import { ArtistStoryQuoteType, toQuote } from "./artistStoryQuote"

export interface GravityArtistStoryVideo {
  id: string
  artist_story_id: string
  video_id: string
  video: GravityVideo | null
  role: "header" | "motion" | "process"
  position: number
  caption: string | null
  quote: string | null
  quote_attribution: string | null
  created_at: string
  updated_at: string
}

export const ArtistStoryVideoRoleEnum = new GraphQLEnumType({
  name: "ArtistStoryVideoRole",
  values: {
    HEADER: {
      value: "header",
      description: "Silent background loop behind the page header. Vimeo only.",
    },
    MOTION: {
      value: "motion",
      description: "Silent loop with a caption and quote. Vimeo only.",
    },
    PROCESS: {
      value: "process",
      description: "The artist's process film. Vimeo or YouTube.",
    },
  },
})

// internalID is the placement's id, not the Video's.
export const ArtistStoryVideoType = new GraphQLObjectType<
  GravityArtistStoryVideo,
  ResolverContext
>({
  name: "ArtistStoryVideo",
  fields: () => ({
    ...IDFields,
    role: { type: new GraphQLNonNull(ArtistStoryVideoRoleEnum) },
    position: { type: new GraphQLNonNull(GraphQLInt) },
    caption: { type: GraphQLString },
    quote: {
      type: ArtistStoryQuoteType,
      resolve: ({ quote, quote_attribution }) => {
        return toQuote({ text: quote, attribution: quote_attribution })
      },
    },
    video: {
      type: new GraphQLNonNull(VideoType),
    },
  }),
})
