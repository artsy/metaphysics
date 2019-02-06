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
}

/**
 * The root values we pass into the GraphQL query resolver,
 * contains optional user information, and all of our data-loaders.
 * */
export type RootValue = void

export type ResolverContext = ResolverContextValues &
  ReturnType<typeof createLoaders>

declare module "graphql/type" {
  interface GraphQLResolveInfo {
    /**
     * Where we store user/data-loader context, yes there's a context
     * object but without a big refactor it's not happening soon.
     */
    readonly rootValue: RootValue
  }
}
