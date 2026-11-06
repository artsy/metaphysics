import { GraphQLFieldConfig } from "graphql"
import config from "config"
import { ResolverContext } from "types/graphql"
import { isFeatureFlagEnabled } from "lib/featureFlags"
import {
  ArtistStoryType,
  GravityArtistStory,
} from "schema/v2/artistStory/artistStory"

const CONTENT_FIELDS: (keyof GravityArtistStory)[] = [
  "tagline",
  "pull_quote",
  "pull_quote_attribution",
  "about_body",
  "portrait_image",
  "portrait_alt_text",
  "portrait_credit",
  "header_image",
  "header_image_alt_text",
  "header_image_credit",
  "accent_color",
]

const isBlank = (value: unknown) =>
  value == null || (typeof value === "string" && value.trim() === "")

export const Story: GraphQLFieldConfig<{ id: string }, ResolverContext> = {
  type: ArtistStoryType,
  description: "The Featured Partner's Story.",
  resolve: async (
    { id },
    _args,
    { partnerArtistsForArtistLoader, artistStoriesLoader }
  ) => {
    // Read per call so tests can toggle it.
    const isDevelopment = config.NODE_ENV === "development"

    if (!isDevelopment && !isFeatureFlagEnabled("fireworksq4_artist-story")) {
      return null
    }

    // Same lookup as biographyBlurb, so the two share one cached Gravity call.
    const partnerArtists = await partnerArtistsForArtistLoader(id, {
      size: 1,
      featured: true,
    })
    const featured = partnerArtists?.[0]
    if (!featured) return null

    const stories = await artistStoriesLoader({
      partner_artist_id: featured.id,
    })
    const story = stories?.[0]
    if (!story || CONTENT_FIELDS.every((field) => isBlank(story[field]))) {
      return null
    }

    return story
  },
}
