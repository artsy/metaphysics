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

export interface GravityArtistVideo {
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

export const ArtistVideoRoleEnum = new GraphQLEnumType({
  name: "ArtistVideoRole",
  values: {
    HEADER: { value: "header" },
    MOTION: { value: "motion" },
    PROCESS: { value: "process" },
  },
})

// internalID is the placement's id, not the Video's.
export const ArtistVideoType = new GraphQLObjectType<
  GravityArtistVideo,
  ResolverContext
>({
  name: "ArtistVideo",
  fields: () => ({
    ...IDFields,
    role: { type: new GraphQLNonNull(ArtistVideoRoleEnum) },
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
