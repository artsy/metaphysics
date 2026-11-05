// Adapted from https://github.com/artsy/force/blob/c3fe1f217e5572f8098fbfac2e975dae027b876f/src/Utils/Hooks/useStableShuffle.ts

/**
 * Each subsequent call to the return function of xmur3 produces a new "random"
 * 32-bit hash value to be used as a seed in a PRNG.
 * https://github.com/bryc/code/blob/master/jshash/PRNGs.md#addendum-a-seed-generating-functions
 */
export const xmur3 = (str: string) => {
  let h = 1779033703 ^ str.length

  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }

  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return (h ^= h >>> 16) >>> 0
  }
}

/**
 * https://github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32
 */
export const mulberry32 = (a: number) => {
  return () => {
    let t = (a += 0x6d2b79f5)

    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Returns a Fisher-Yates shuffle function seeded with seed value
 * https://stackoverflow.com/a/53758827/160937
 */
export const seededShuffle = (seed: string) => {
  const hash = xmur3(seed)
  const random = mulberry32(hash())

  const shuffle = <T>(xs: T[]) => {
    const array = xs.slice()

    let m = array.length,
      t: T,
      i: number

    while (m) {
      i = Math.floor(random() * m--)
      t = array[m]
      array[m] = array[i]
      array[i] = t
    }

    return array
  }

  return { shuffle }
}

/**
 * Performs a single Fisher-Yates shuffle that will remain stable
 * for the entire duration of the current UTC day (default), or
 * for an entire day in the provided time zone (optional).
 *
 * The second argument is an optional IANA time zone identifier string,
 * e.g. `America/New_York` or `Asia/Shanghai`.
 *
 * In a resolver, this info may be read from a request context:
 *
 * ```ts
 * resolve: (parent, _args, context, _info) => {
    const { artworkIDs } = parent
    const { defaultTimezone } = context
    const shuffledIDs = dailyShuffle(artworkIDs, defaultTimezone)
    …
  },
 * ```
 */
export const dailyShuffle = <T>(array: T[], timeZone = "UTC") => {
  let today: string

  try {
    today = new Date(Date.now()).toLocaleString("en-GB", { timeZone })
  } catch (error) {
    if (error.name === "RangeError") {
      // invalid time zone; fall back to UTC
      today = new Date(Date.now()).toLocaleString("en-GB", { timeZone: "UTC" })
    } else {
      throw error
    }
  }

  const dd_mm_yyyy = today.slice(0, 10)
  const { shuffle } = seededShuffle(dd_mm_yyyy)
  return shuffle(array)
}
