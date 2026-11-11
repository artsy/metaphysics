import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { IDFields } from "schema/v2/object_identification"
import { markdown } from "schema/v2/fields/markdown"
import { ImageType } from "schema/v2/image"
import { ArtistStoryQuoteType, toQuote } from "./artistStoryQuote"
import {
  ArtistStoryVideoType,
  GravityArtistStoryVideo,
} from "./artistStoryVideo"
import {
  ArtistStoryAccentColorType,
  toAccentColor,
} from "schema/v2/artistStory/artistStoryAccentColor"

export interface GravityArtistStoryImage {
  id: string
  image_url: string | null
  image_urls: Record<string, string> | null
  image_versions: string[] | null
  original_width: number | null
  original_height: number | null
  aspect_ratio: number | null
}

export interface GravityArtistStory {
  id: string
  partner_artist_id: string
  tagline: string | null
  pull_quote: string | null
  pull_quote_attribution: string | null
  about_body: string | null
  portrait_image: GravityArtistStoryImage | null
  portrait_alt_text: string | null
  portrait_credit: string | null
  header_image: GravityArtistStoryImage | null
  header_image_alt_text: string | null
  header_image_credit: string | null
  accent_color: string | null
  created_at: string
  updated_at: string
}

interface StoryImage {
  image: GravityArtistStoryImage
  altText: string
  credit: string | null
}

const ArtistStoryImageType = new GraphQLObjectType<StoryImage, ResolverContext>(
  {
    name: "ArtistStoryImage",
    fields: {
      image: {
        type: new GraphQLNonNull(ImageType),
      },
      altText: { type: new GraphQLNonNull(GraphQLString) },
      credit: { type: GraphQLString },
    },
  }
)

// An image that is still processing has no URL yet and can't be shown.
const toStoryImage = ({
  image,
  altText,
  credit,
}: {
  image: GravityArtistStoryImage | null
  altText: string | null
  credit: string | null
}) => {
  return image?.image_url ? { image, altText: altText ?? "", credit } : null
}

// A placement whose Video wasn't embedded would otherwise null a non-null field.
const videosInRole = (
  videos: GravityArtistStoryVideo[] | null,
  role: GravityArtistStoryVideo["role"]
) => {
  if (!videos) {
    return []
  }

  return videos
    .filter((placement) => placement.role === role && placement.video != null)
    .sort((a, b) => a.position - b.position)
}

const ArtistStoryAboutType = new GraphQLObjectType<
  GravityArtistStory,
  ResolverContext
>({
  name: "ArtistStoryAbout",
  fields: () => ({
    tagline: { type: GraphQLString },
    body: markdown((story) => story.about_body),
    portrait: {
      type: ArtistStoryImageType,
      resolve: ({ portrait_image, portrait_alt_text, portrait_credit }) => {
        return toStoryImage({
          image: portrait_image,
          altText: portrait_alt_text,
          credit: portrait_credit,
        })
      },
    },
  }),
})

export const ArtistStoryType = new GraphQLObjectType<
  GravityArtistStory,
  ResolverContext
>({
  name: "ArtistStory",
  fields: () => ({
    ...IDFields,
    accentColor: {
      type: ArtistStoryAccentColorType,
      resolve: ({ accent_color }) => toAccentColor(accent_color),
    },
    about: {
      type: ArtistStoryAboutType,
      resolve: (story) => story,
    },
    pullQuote: {
      type: ArtistStoryQuoteType,
      resolve: ({ pull_quote, pull_quote_attribution }) => {
        return toQuote({
          text: pull_quote,
          attribution: pull_quote_attribution,
        })
      },
    },
    headerImage: {
      type: ArtistStoryImageType,
      resolve: ({
        header_image,
        header_image_alt_text,
        header_image_credit,
      }) => {
        return toStoryImage({
          image: header_image,
          altText: header_image_alt_text,
          credit: header_image_credit,
        })
      },
    },
    headerVideo: {
      type: ArtistStoryVideoType,
      resolve: async ({ id }, _args, { artistStoryVideosLoader }) => {
        const videos = await artistStoryVideosLoader({ artist_story_id: id })

        return videosInRole(videos, "header")[0] ?? null
      },
    },
    motionVideos: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ArtistStoryVideoType))
      ),
      resolve: async ({ id }, _args, { artistStoryVideosLoader }) => {
        const videos = await artistStoryVideosLoader({
          artist_story_id: id,
        }).catch(() => null)

        return videosInRole(videos, "motion")
      },
    },
    processVideo: {
      type: ArtistStoryVideoType,
      resolve: async ({ id }, _args, { artistStoryVideosLoader }) => {
        const videos = await artistStoryVideosLoader({ artist_story_id: id })

        return videosInRole(videos, "process")[0] ?? null
      },
    },
  }),
})
