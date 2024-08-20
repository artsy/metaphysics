import { BodyAndHeaders, ResponseHeaders } from "."
import { StaticPathLoader } from "./api/loader_interface"

const MAX_FOLLOWED_ARTISTS_PER_STEP = 100
const MAX_STEPS = 1

/**
 * This is a wrapper for invoking a data loader with a configurable timeout.
 */
export const withTimeout = async (loader: Promise<any>, timeoutMs: number) => {
  try {
    let data: unknown

    await new Promise<void>((resolve, reject) => {
      // Will reject promise after configured timeout if the loader command has
      // not completed yet.
      let timeoutId: NodeJS.Timeout | null = setTimeout(() => {
        timeoutId = null

        const error = new Error(`Timeout of ${timeoutMs}ms`)

        reject(error)
      }, timeoutMs)

      const onComplete = (response) => {
        if (!timeoutId) {
          return // Already timed out.
        }

        clearTimeout(timeoutId)
        data = response
        resolve()
      }

      const onError = (error) => {
        if (!timeoutId) {
          return // Already timed out.
        }

        clearTimeout(timeoutId)
        reject(error)
      }

      loader.then(onComplete).catch(onError)
    })

    return data
  } catch (e) {
    console.error(`[withTimeout]: ${e.message}`)

    // Re-throw to bubble up the error.
    throw e
  }
}

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
