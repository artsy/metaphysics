import { GraphQLFieldConfig } from "graphql"
import config from "config"
import { ResolverContext } from "types/graphql"
import { isFeatureFlagEnabled } from "lib/featureFlags"
import { isUnderListPath } from "lib/helpers"
import { ArtistStoryType } from "schema/v2/artistStory/artistStory"

export const FeaturedStory: GraphQLFieldConfig<
  { id: string },
  ResolverContext
> = {
  type: ArtistStoryType,
  resolve: async (
    { id },
    _args,
    { partnerArtistsForArtistLoader, artistStoriesLoader },
    info
  ) => {
    // Read per call so tests can toggle it.
    const isDevelopment = config.NODE_ENV === "development"

    if (!isDevelopment && !isFeatureFlagEnabled("fireworksq4_artist-story")) {
      return null
    }

    // The endpoint can't batch yet, so block lists to avoid one call per artist.
    if (isUnderListPath(info)) {
      throw new Error(
        "[artist/featuredStory] This field cannot be queried under a list or connection " +
          "(e.g. artistsConnection); it is only supported for a single artist via artist(id:)."
      )
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

    return stories?.[0] ?? null
  },
}
