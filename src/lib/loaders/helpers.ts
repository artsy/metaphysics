import { BodyAndHeaders, ResponseHeaders } from "."
import { StaticPathLoader } from "./api/loader_interface"

const MAX_FOLLOWED_ARTISTS_PER_STEP = 100
const MAX_STEPS = 1

/**
 * This is a helper function that loads all followed artists for a user.
 * Since we cannot query more than 100 artists at a time, we have to do this in several steps.
 */
export const allFollowedArtistsLoader = async (
  followedArtistsLoader: StaticPathLoader<BodyAndHeaders<any, ResponseHeaders>>
) => {
  let followedArtists: any[] = []

  // Since we cannot query more than 100 artists at a time, we have to do this in several steps.
  for (let step = 0; step < MAX_STEPS; step++) {
    const gravityArgs = {
      size: MAX_FOLLOWED_ARTISTS_PER_STEP,
      offset: step * MAX_FOLLOWED_ARTISTS_PER_STEP,
      total_count: false,
    }
    const { body: artists } = await followedArtistsLoader(gravityArgs)

    followedArtists = [...followedArtists, ...artists]

    if (artists < MAX_FOLLOWED_ARTISTS_PER_STEP) {
      break
    }
  }

  return followedArtists
}
