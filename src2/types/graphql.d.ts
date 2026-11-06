import { ArtnetEnv } from "../lib/artnetEnv"
import { createLoaders } from "../lib/loaders"

export interface ResolverContextValues {
  appToken?: string
  /** Optionally you can include an access token for a logged in user */
  accessToken?: string
  /** Optionally you can include a user token for a logged in user */
  userID?: string
  /** Optionally you should include a timezone for the user */
  defaultTimezone?: string

  requestIDs: {
    requestID: string
    xForwardedFor: string
    xOriginalSessionID: string
  }

  /** The user-agent of the HTTP client */
  userAgent?: string | string[]

  ipAddress: string
  xImpersonateUserID?: string
  isCMSRequest: boolean

  /** The Artnet environment for this request (see lib/artnetEnv.ts) */
  artnetEnv: () => ArtnetEnv
}

export type ResolverContext = ResolverContextValues &
  ReturnType<typeof createLoaders>

export type Thunk<T> = T | (() => T)
