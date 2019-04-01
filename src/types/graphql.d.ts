import { GraphQLSchema } from "graphql/type"
import createLoaders from "../lib/loaders"

export interface ResolverContextValues {
  /** Optionally you can include an access token for a logged in user */
  accessToken?: string
  /** Optionally you can include a user token for a logged in user */
  userID?: string
  /** Optionally you should include a timezone for the user */
  defaultTimezone?: string

  /** The schema used by the internal exchange graphql engine */
  exchangeSchema: GraphQLSchema

  /**
   * TODO: Why is this shaped like this, instead of a single ID?
   */
  requestIDs: {
    requestID: string
    xForwardedFor: string
  }

  /** The user-agent of the HTTP client */
  userAgent?: string | string[]
}

export type ResolverContext = ResolverContextValues &
  ReturnType<typeof createLoaders>
