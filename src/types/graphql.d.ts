import { GraphQLSchema } from "graphql/type"
import { createLoaders } from "../lib/loaders"
import { ImageData } from "schema/v2/image/normalize"

export interface ResolverContextValues {
  appToken?: string
  /** Optionally you can include an access token for a logged in user */
  accessToken?: string
  /** Optionally you can include a user token for a logged in user */
  userID?: string
  /** Optionally you should include a timezone for the user */
  defaultTimezone?: string

  /** The schema used by the internal exchange graphql engine */
  exchangeSchema: GraphQLSchema

  requestIDs: {
    requestID: string
    xForwardedFor: string
    xOriginalSessionID: string
  }

  /** The user-agent of the HTTP client */
  userAgent?: string | string[]

  /** Used when stitching in image data from a backend, but resolving
   * to the MP `Image` type
   */
  imageData?: ImageData

  ipAddress: string
  xImpersonateUserID?: string
  isCMSRequest: boolean
}

export type ResolverContext = ResolverContextValues &
  ReturnType<typeof createLoaders>
